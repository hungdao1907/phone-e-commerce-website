import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import defaultPrisma from '../config/prisma';
import dns from 'node:dns';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import {
  CUSTOMER_REGISTRATION_OTP_TTL_MS,
  generateCustomerRegistrationOtp,
  hashCustomerRegistrationOtp,
  issueCustomerRegistrationOtpChallenge,
  isCustomerRegistrationOtpExpired,
  isCustomerRegistrationOtpResendCoolingDown,
  parseCustomerRegistrationOtpChallenge,
  verifyCustomerRegistrationOtpAttempt,
} from '../services/customer-registration-otp';
import { mailer, isEmailConfigured as defaultEmailConfigured } from '../services/mailer';
import { customerPasswordError, isCustomerEmail, normalizeCustomerEmail, validateCustomerRegistration } from '../services/customer-account-policy';

// Fix IPv6 timeout issues on Render/Node 18+ by forcing IPv4 resolution first
dns.setDefaultResultOrder('ipv4first');

import { JWT_SECRET } from '../config/auth';

export function createAuthRouter({ prisma = defaultPrisma, smtpTransporter = mailer, isEmailConfigured = defaultEmailConfigured } = {}) {
const router = express.Router();
const findCustomerByEmail = (email: string) => prisma.customer.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

// ----------------------------------------------------
// CUSTOMER OTP REGISTRATION ROUTES
// ----------------------------------------------------
router.post('/customer/register', async (req, res) => {
  const { fullName, email, phone, password, errors } = validateCustomerRegistration(req.body || {});
  if (Object.keys(errors).length) {
    return res.status(400).json({ message: 'Vui lòng kiểm tra thông tin đăng ký.', errors });
  }

  if (!isEmailConfigured()) {
    return res.status(503).json({ message: 'Dịch vụ gửi mã xác thực hiện không khả dụng.' });
  }

  try {
    const existing = await findCustomerByEmail(email);

    if (existing && existing.verified) {
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateCustomerRegistrationOtp();
    const storedChallenge = hashCustomerRegistrationOtp(otp, JWT_SECRET);
    const otpExpiry = new Date(now.getTime() + CUSTOMER_REGISTRATION_OTP_TTL_MS);
    let customerId: string;

    if (existing) {
      if (isCustomerRegistrationOtpResendCoolingDown(existing.otpExpiry, now)) {
        return res.status(429).json({ message: 'Vui lòng đợi trước khi yêu cầu gửi lại mã xác thực.' });
      }
      const issuance = await issueCustomerRegistrationOtpChallenge(
        existing.otp,
        existing.otpExpiry,
        storedChallenge,
        otpExpiry,
        now,
        async (expectedChallenge, challengeUpdate) => {
          const updated = await prisma.customer.updateMany({
            where: { id: existing.id, verified: false, otp: expectedChallenge },
            data: { fullName, phone, password: hashedPassword, ...challengeUpdate }
          });
          return updated.count === 1;
        }
      );
      if (issuance !== 'issued') {
        return res.status(429).json({ message: 'Mã xác thực vừa được yêu cầu. Vui lòng đợi rồi thử lại.' });
      }
      customerId = existing.id;
    } else {
      const customer = await prisma.customer.create({
        data: { fullName, phone, email, password: hashedPassword, verified: false, otp: storedChallenge, otpExpiry }
      });
      customerId = customer.id;
    }

    try {
      await smtpTransporter.sendMail({
        from: `"AppleWeb" <${process.env.SMTP_EMAIL || 'no-reply@localhost'}>`,
        to: email,
        subject: '[H&M Phone Store] Mã xác thực đăng ký tài khoản',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px">
            <h2 style="color:#000;margin-bottom:16px">AppleWeb</h2>
            <p>Xin chào <strong>${escapeHtml(fullName.trim())}</strong>,</p>
            <p>Mã xác thực (OTP) đăng ký tài khoản của bạn là:</p>
            <div style="font-size:32px;font-weight:bold;text-align:center;padding:16px;background:#99e300;color:black;border-radius:8px;letter-spacing:8px;margin:16px 0">
              ${otp}
            </div>
          </div>
        `
      });
    } catch {
      await prisma.customer.updateMany({
        where: { id: customerId, otp: storedChallenge },
        data: { otp: null, otpExpiry: null }
      });
      console.error('Customer registration OTP delivery failed.');
      return res.status(503).json({ message: 'Không thể gửi mã xác thực lúc này. Vui lòng thử lại sau.' });
    }

    res.json({ message: 'Đã gửi mã OTP về email của bạn.' });
  } catch (error) {
    if ((error as any)?.code === 'P2002') {
      return res.status(409).json({ message: 'Không thể tạo yêu cầu xác thực trùng lặp.' });
    }
    console.error('Customer registration request failed.');
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

router.post('/customer/resend-otp', async (req, res) => {
  const email = normalizeCustomerEmail(req.body?.email);
  if (!isCustomerEmail(email)) return res.status(400).json({ message: 'Email không hợp lệ.' });
  const message = 'Nếu tài khoản đang chờ xác minh, mã OTP đã được gửi về email.';
  try {
    const customer = await findCustomerByEmail(email);
    if (!customer || customer.verified) return res.json({ message });
    if (!isEmailConfigured()) return res.status(503).json({ message: 'Dịch vụ gửi mã xác thực hiện không khả dụng.' });
    const now = new Date();
    const otp = generateCustomerRegistrationOtp();
    const challenge = hashCustomerRegistrationOtp(otp, JWT_SECRET);
    const result = await issueCustomerRegistrationOtpChallenge(customer.otp, customer.otpExpiry, challenge,
      new Date(now.getTime() + CUSTOMER_REGISTRATION_OTP_TTL_MS), now,
      async (expected, data) => (await prisma.customer.updateMany({ where: { id: customer.id, verified: false, otp: expected }, data })).count === 1);
    if (result !== 'issued') return res.status(429).json({ message: 'Vui lòng đợi trước khi yêu cầu gửi lại mã xác thực.' });
    try {
      await smtpTransporter.sendMail({ to: customer.email, subject: '[WebPhone] Mã xác thực đăng ký tài khoản',
        html: `<p>Mã xác thực đăng ký WebPhone: <strong>${otp}</strong>. Mã có hiệu lực 5 phút.</p>` });
    } catch {
      await prisma.customer.updateMany({ where: { id: customer.id, verified: false, otp: challenge }, data: { otp: null, otpExpiry: null } });
      return res.status(503).json({ message: 'Không thể gửi mã xác thực lúc này. Vui lòng thử lại sau.' });
    }
    return res.json({ message });
  } catch {
    console.error('Customer registration OTP resend failed.');
    return res.status(500).json({ message: 'Lỗi server.' });
  }
});

router.post('/customer/verify-otp', async (req, res) => {
  const email = normalizeCustomerEmail(req.body?.email);
  const { otp } = req.body || {};
  if (typeof email !== 'string' || !email.trim() || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email và mã OTP.' });
  }

  try {
    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }
    if (customer.verified) {
      return res.json({ message: 'Tài khoản đã được xác thực trước đó.' });
    }

    const now = new Date();
    if (isCustomerRegistrationOtpExpired(customer.otpExpiry, now)) {
      if (customer.otp) {
        await prisma.customer.updateMany({
          where: { id: customer.id, verified: false, otp: customer.otp },
          data: { otp: null, otpExpiry: null }
        });
      }
      return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
    }

    if (!parseCustomerRegistrationOtpChallenge(customer.otp)) {
      await prisma.customer.updateMany({
        where: { id: customer.id, verified: false, otp: customer.otp },
        data: { otp: null, otpExpiry: null }
      });
      return res.status(400).json({ message: 'Mã xác thực không còn hợp lệ. Vui lòng yêu cầu gửi mã mới.' });
    }
    const verification = await verifyCustomerRegistrationOtpAttempt(
      customer.otp,
      otp,
      JWT_SECRET,
      async (expectedChallenge, data) => {
        const updated = await prisma.customer.updateMany({
          where: { id: customer.id, verified: false, otp: expectedChallenge, otpExpiry: { gt: now } },
          data
        });
        return updated.count === 1;
      }
    );
    if (verification === 'locked') {
      return res.status(429).json({ message: 'Mã xác thực đã bị khóa do nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới sau thời gian chờ.' });
    }
    if (verification === 'incorrect') {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' });
    }
    if (verification !== 'verified') {
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn hoặc đã được sử dụng.' });
    }

    res.json({ message: 'Xác thực thành công! Tài khoản của bạn đã được tạo.' });
  } catch (error) {
    console.error('Customer registration OTP verification failed.');
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

// ----------------------------------------------------
// CUSTOMER FORGOT PASSWORD ROUTES
// ----------------------------------------------------
router.post('/customer/forgot-password', async (req, res) => {
  const email = normalizeCustomerEmail(req.body?.email);
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    const customer = await findCustomerByEmail(email);
    if (!customer || !customer.verified || !isEmailConfigured()) {
      // Security: Do not reveal if email exists.
      return res.json({ message: 'Nếu email này đã được đăng ký, mã xác thực sẽ được gửi đến email của bạn.' });
    }

    const otp = generateCustomerRegistrationOtp();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const storedResetChallenge = hashCustomerRegistrationOtp(otp, JWT_SECRET + ':password-reset');
    const issued = await issueCustomerRegistrationOtpChallenge(customer.otp, customer.otpExpiry, storedResetChallenge, otpExpiry, new Date(),
      async (expected, data) => (await prisma.customer.updateMany({ where: { id: customer.id, verified: true, otp: expected }, data })).count === 1);
    if (issued !== 'issued') return res.status(429).json({ message: 'Please wait before requesting another code.' });

    if (isEmailConfigured()) {
      const currentYear = new Date().getFullYear();
      const otp_expiration = 5;
      await smtpTransporter.sendMail({
        from: `"H&M Phone Store" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: '[H&M Phone Store] Mã xác thực khôi phục mật khẩu',
        html: `
          <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #eaeaea;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
            <div style="text-align:center;margin-bottom:32px">
              <h1 style="color:#000;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">H&M Phone Store</h1>
            </div>

            <h2 style="color:#111;font-size:20px;font-weight:600;margin:0 0 16px 0;text-align:center">Xác thực yêu cầu khôi phục mật khẩu</h2>

            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px 0">Xin chào <strong>${escapeHtml(customer.fullName || 'bạn')}</strong>,</p>

            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px 0">Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản H&M Phone Store của bạn.<br><br>Nếu đây là yêu cầu của bạn, hãy nhập mã xác thực gồm 6 chữ số bên dưới để tiếp tục đặt lại mật khẩu.</p>

            <div style="margin:32px 0;text-align:center">
              <div style="display:inline-block;padding:20px 40px;background:#99e300;border-radius:12px;box-shadow:0 8px 16px rgba(153,227,0,0.2)">
                <span style="color:#000;font-size:36px;font-weight:800;letter-spacing:12px;display:block;margin-right:-12px">${otp}</span>
              </div>
            </div>

            <p style="color:#666;font-size:14px;line-height:1.5;margin:0 0 8px 0;text-align:center">Mã xác thực có hiệu lực trong <strong>${otp_expiration}</strong> phút.</p>

            <div style="background:#fff8f8;border-left:4px solid #ef4444;padding:16px;margin:32px 0;border-radius:0 8px 8px 0">
              <p style="color:#ef4444;font-size:14px;line-height:1.5;margin:0 0 8px 0"><strong>Cảnh báo:</strong> Không chia sẻ mã OTP này với bất kỳ ai.</p>
              <p style="color:#ef4444;font-size:14px;line-height:1.5;margin:0">Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn và mật khẩu hiện tại sẽ không bị thay đổi.</p>
            </div>

            <hr style="border:none;border-top:1px solid #eaeaea;margin:32px 0">

            <div style="text-align:center;color:#888;font-size:12px;line-height:1.6">
              <p style="margin:0 0 8px 0">H&M Phone Store</p>
              <p style="margin:0 0 16px 0">Email này được gửi tự động, vui lòng không trả lời trực tiếp email này.</p>
              <p style="margin:0">© ${currentYear} H&M Phone Store. All rights reserved.</p>
            </div>
          </div>
        `
      });
    } else {
      console.warn('Password recovery email is not configured.');
    }

    res.json({ message: 'Nếu email này đã được đăng ký, mã xác thực sẽ được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Forgot password request failed.');
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' });
  }
});

router.post('/customer/verify-reset-otp', async (req, res) => {
  const email = normalizeCustomerEmail(req.body?.email);
  const { otp } = req.body || {};
  if (typeof email !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    const customer = await findCustomerByEmail(email);
    if (!customer || !customer.verified) {
      return res.status(400).json({ message: 'Mã xác thực không chính xác. Vui lòng thử lại.' });
    }

    if (isCustomerRegistrationOtpExpired(customer.otpExpiry)) {
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    const verified = await verifyCustomerRegistrationOtpAttempt(customer.otp, otp, JWT_SECRET + ':password-reset',
      async (expected, data) => (await prisma.customer.updateMany({ where: { id: customer.id, verified: true, otp: expected, otpExpiry: { gt: new Date() } }, data })).count === 1);
    if (verified !== 'verified') return res.status(verified === 'locked' ? 429 : 400).json({ message: 'Invalid or consumed verification code.' });

    const resetSecret = JWT_SECRET + customer.password;
    const resetToken = jwt.sign({ email, purpose: 'password-reset' }, resetSecret, { expiresIn: '15m', subject: customer.id, audience: 'customer-password-reset' });

    res.json({ resetToken });
  } catch (error) {
    console.error('Password reset OTP verification failed.');
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' });
  }
});

router.post('/customer/reset-password', async (req, res) => {
  const email = normalizeCustomerEmail(req.body?.email);
  const { resetToken, newPassword } = req.body || {};
  if (!isCustomerEmail(email) || typeof resetToken !== 'string' || customerPasswordError(newPassword)) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng thực hiện lại từ đầu.' });
    }

    const resetSecret = JWT_SECRET + customer.password;
    try {
      const claims = jwt.verify(resetToken, resetSecret, { audience: 'customer-password-reset', subject: customer.id });
      if (typeof claims === 'string' || normalizeCustomerEmail(claims.email) !== email || claims.purpose !== 'password-reset') throw new Error('Invalid reset claims');
    } catch (err) {
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại từ đầu.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const changed = await prisma.customer.updateMany({
      where: { id: customer.id, password: customer.password, verified: true },
      data: { password: hashedPassword }
    });
    if (changed.count !== 1) return res.status(409).json({ message: 'Password was already changed; request a new reset.' });

    res.json({ message: 'Mật khẩu đã được đặt lại thành công.' });
  } catch (error) {
    console.error('Password reset failed.');
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' });
  }
});

// Dedicated customer endpoint; the legacy endpoint below still accepts customer email
// for deployed clients while preserving internal username authentication.
router.post('/customer/login', async (req, res) => {
  const email = normalizeCustomerEmail(req.body?.email);
  const password = req.body?.password;
  if (!isCustomerEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập Gmail và mật khẩu hợp lệ.' });
  }
  try {
    const customer = await findCustomerByEmail(email);
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
    }
    if (!customer.verified) return res.status(403).json({ message: 'Tài khoản chưa được xác thực email.' });
    const token = jwt.sign({ id: customer.id, username: customer.username || customer.email, role: 'customer' }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, otp, otpExpiry, ...safeCustomer } = customer;
    return res.json({ message: 'Đăng nhập thành công', token, user: { ...safeCustomer, role: 'customer', username: customer.username || customer.email } });
  } catch {
    console.error('Customer login failed.');
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request
    if (typeof username !== 'string' || !username || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }

    // Try finding a User (Staff/Admin) first
    let accountInfo: any = await prisma.user.findUnique({
      where: { username }
    });
    let role = accountInfo?.role || 'user'; // default role for users is what they have in DB

    // If not found in User, try finding a Customer (using username field as email)
    if (!accountInfo && isCustomerEmail(normalizeCustomerEmail(username))) {
      accountInfo = await findCustomerByEmail(normalizeCustomerEmail(username));
      if (accountInfo) {
        role = 'customer'; // Assign a virtual role for customers

      }
    }

    if (!accountInfo) {
      return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, accountInfo.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Sai thông tin đăng nhập' });
    }
    if (role === 'customer' && !accountInfo.verified) {
      return res.status(403).json({ message: 'Tài khoản chưa được xác thực email.' });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: accountInfo.id,
        username: accountInfo.username || accountInfo.email,
        role: role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user object before sending response
    const { password: _, otp, otpExpiry, ...userWithoutPassword } = accountInfo;

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        ...userWithoutPassword,
        role, // explicitly attach the role
        username: accountInfo.username || accountInfo.email
      }
    });
  } catch (error) {
    console.error('Login failed.');
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Register Endpoint (for Staff / Nhân sự)
router.post('/register', authenticateToken, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (default role is 'staff' for new registrations, superadmin is seeded)
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'staff' // Default role for standard signups
      }
    });

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Registration successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

return router;
}

export default createAuthRouter();
