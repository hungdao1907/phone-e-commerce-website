import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import nodemailer from 'nodemailer';
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

// Fix IPv6 timeout issues on Render/Node 18+ by forcing IPv4 resolution first
dns.setDefaultResultOrder('ipv4first');
const router = express.Router();

import { JWT_SECRET } from '../config/auth';

const smtpTransporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === 'true',
      ...(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD
        ? { auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD } }
        : {}),
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });

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
  const { fullName, email, password } = req.body;

  if (typeof fullName !== 'string' || !fullName.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đủ thông tin.' });
  }

  if (!process.env.SMTP_HOST && (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD)) {
    return res.status(503).json({ message: 'Dịch vụ gửi mã xác thực hiện không khả dụng.' });
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing && existing.verified) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
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
            data: { fullName: fullName.trim(), password: hashedPassword, ...challengeUpdate }
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
        data: { fullName: fullName.trim(), email, password: hashedPassword, otp: storedChallenge, otpExpiry }
      });
      customerId = customer.id;
    }

    try {
      await smtpTransporter.sendMail({
        from: `"AppleWeb" <${process.env.SMTP_EMAIL || 'no-reply@localhost'}>`,
        to: email,
        subject: 'AppleWeb - Mã xác thực OTP của bạn',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px">
            <h2 style="color:#000;margin-bottom:16px">AppleWeb</h2>
            <p>Xin chào <strong>${escapeHtml(fullName.trim())}</strong>,</p>
            <p>Mã xác thực (OTP) đăng ký tài khoản của bạn là:</p>
            <div style="font-size:32px;font-weight:bold;text-align:center;padding:16px;background:#99e300;color:black;border-radius:8px;letter-spacing:8px;margin:16px 0">
              ${otp}
            </div>
            <p style="color:#666;font-size:14px">Mã này có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.</p>
            <p style="color:#999;font-size:12px;margin-top:24px">— AppleWeb Team</p>
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

router.post('/customer/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (typeof email !== 'string' || !email.trim() || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email và mã OTP.' });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
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

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate request
    if (!username || !password) {
      return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }

    // Try finding a User (Staff/Admin) first
    let accountInfo: any = await prisma.user.findUnique({
      where: { username }
    });
    let role = accountInfo?.role || 'user'; // default role for users is what they have in DB

    // If not found in User, try finding a Customer (using username field as email)
    if (!accountInfo) {
      accountInfo = await prisma.customer.findUnique({
        where: { email: username }
      });
      if (accountInfo) {
        role = 'customer'; // Assign a virtual role for customers
        
        // Ensure customer is verified
        if (!accountInfo.verified) {
          return res.status(403).json({ message: 'Tài khoản chưa được xác thực email.' });
        }
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
    console.error('Login error:', error);
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

export default router;
