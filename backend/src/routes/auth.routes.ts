import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dns from 'node:dns';

// Fix IPv6 timeout issues on Render/Node 18+ by forcing IPv4 resolution first
dns.setDefaultResultOrder('ipv4first');
const router = express.Router();
const prisma = new PrismaClient();

import { JWT_SECRET } from '../config/auth';

const smtpTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || '',
    pass: process.env.SMTP_PASSWORD || ''
  }
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ----------------------------------------------------
// CUSTOMER OTP REGISTRATION ROUTES
// ----------------------------------------------------
router.post('/customer/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Dữ liệu đăng ký không hợp lệ.' });
  }

  try {
    const existingUsername = await prisma.customer.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ message: 'Tên đăng nhập này đã được sử dụng.' });
    }

    const existingEmail = await prisma.customer.findUnique({ where: { email } });
    if (existingEmail && existingEmail.verified) {
      return res.status(409).json({ message: 'Email này đã được sử dụng.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (existingEmail) {
      await prisma.customer.update({
        where: { email },
        data: { username, password: hashedPassword, otp, otpExpiry }
      });
    } else {
      await prisma.customer.create({
        data: { username, email, password: hashedPassword, otp, otpExpiry }
      });
    }

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const currentYear = new Date().getFullYear();
      const otp_expiration = 5;
      smtpTransporter.sendMail({
        from: `"H&M Phone Store" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: '[H&M Phone Store] Mã xác thực đăng ký tài khoản',
        html: `
          <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #eaeaea;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
            <div style="text-align:center;margin-bottom:32px">
              <h1 style="color:#000;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">H&M Phone Store</h1>
            </div>
            
            <h2 style="color:#111;font-size:20px;font-weight:600;margin:0 0 16px 0;text-align:center">Xác thực tài khoản H&M Phone Store</h2>
            
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px 0">Xin chào <strong>${username}</strong>,</p>
            
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px 0">Cảm ơn bạn đã đăng ký tài khoản tại H&M Phone Store.<br><br>Để hoàn tất quá trình đăng ký, vui lòng nhập mã xác thực gồm 6 chữ số bên dưới vào trang xác thực.</p>
            
            <div style="margin:32px 0;text-align:center">
              <div style="display:inline-block;padding:20px 40px;background:#99e300;border-radius:12px;box-shadow:0 8px 16px rgba(153,227,0,0.2)">
                <span style="color:#000;font-size:36px;font-weight:800;letter-spacing:12px;display:block;margin-right:-12px">${otp}</span>
              </div>
            </div>
            
            <p style="color:#666;font-size:14px;line-height:1.5;margin:0 0 8px 0;text-align:center">Mã xác thực có hiệu lực trong <strong>${otp_expiration}</strong> phút.</p>
            
            <div style="background:#fff8f8;border-left:4px solid #ef4444;padding:16px;margin:32px 0;border-radius:0 8px 8px 0">
              <p style="color:#ef4444;font-size:14px;line-height:1.5;margin:0 0 8px 0"><strong>Cảnh báo:</strong> Không chia sẻ mã OTP này với bất kỳ ai, kể cả nhân viên H&M Phone Store.</p>
              <p style="color:#ef4444;font-size:14px;line-height:1.5;margin:0">Nếu bạn không thực hiện yêu cầu đăng ký tài khoản này, vui lòng bỏ qua email.</p>
            </div>
            
            <hr style="border:none;border-top:1px solid #eaeaea;margin:32px 0">
            
            <div style="text-align:center;color:#888;font-size:12px;line-height:1.6">
              <p style="margin:0 0 8px 0">H&M Phone Store</p>
              <p style="margin:0 0 16px 0">Email này được gửi tự động, vui lòng không trả lời trực tiếp email này.</p>
              <p style="margin:0">© ${currentYear} H&M Phone Store. All rights reserved.</p>
            </div>
          </div>
        `
      }).catch(err => {
        console.error('Lỗi khi gửi email OTP:', err);
      });
    } else {
      console.log('OTP Generated (Email not configured):', otp);
    }

    res.json({ message: 'Đã gửi mã OTP về email của bạn.' });
  } catch (error) {
    console.error('Customer register error:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

router.post('/customer/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
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
    if (customer.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không chính xác.' });
    }
    if (customer.otpExpiry && customer.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn.' });
    }

    await prisma.customer.update({
      where: { email },
      data: { verified: true, otp: null, otpExpiry: null }
    });

    res.json({ message: 'Xác thực thành công! Tài khoản của bạn đã được tạo.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

// ----------------------------------------------------
// CUSTOMER FORGOT PASSWORD ROUTES
// ----------------------------------------------------
router.post('/customer/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      // Security: Do not reveal if email exists.
      return res.json({ message: 'Nếu email này đã được đăng ký, mã xác thực sẽ được gửi đến email của bạn.' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.customer.update({
      where: { email },
      data: { otp, otpExpiry }
    });

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      const currentYear = new Date().getFullYear();
      const otp_expiration = 5;
      smtpTransporter.sendMail({
        from: `"H&M Phone Store" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: '[H&M Phone Store] Mã xác thực khôi phục mật khẩu',
        html: `
          <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #eaeaea;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
            <div style="text-align:center;margin-bottom:32px">
              <h1 style="color:#000;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">H&M Phone Store</h1>
            </div>
            
            <h2 style="color:#111;font-size:20px;font-weight:600;margin:0 0 16px 0;text-align:center">Xác thực yêu cầu khôi phục mật khẩu</h2>
            
            <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px 0">Xin chào <strong>${customer.username}</strong>,</p>
            
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
      }).catch(err => {
        console.error('Lỗi khi gửi email khôi phục mật khẩu:', err);
      });
    } else {
      console.log('OTP Forgot Password Generated (Email not configured):', otp);
    }

    res.json({ message: 'Nếu email này đã được đăng ký, mã xác thực sẽ được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' });
  }
});

router.post('/customer/verify-reset-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return res.status(400).json({ message: 'Mã xác thực không chính xác. Vui lòng thử lại.' });
    }

    if (customer.otp !== otp) {
      return res.status(400).json({ message: 'Mã xác thực không chính xác. Vui lòng thử lại.' });
    }
    if (customer.otpExpiry && customer.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    // OTP is valid. Clear OTP and generate a temporary reset token.
    await prisma.customer.update({
      where: { email },
      data: { otp: null, otpExpiry: null }
    });

    const resetSecret = JWT_SECRET + customer.password;
    const resetToken = jwt.sign({ email }, resetSecret, { expiresIn: '15m' });

    res.json({ resetToken });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' });
  }
});

router.post('/customer/reset-password', async (req, res) => {
  const { email, resetToken, newPassword } = req.body;
  if (!email || !resetToken || !newPassword) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng thực hiện lại từ đầu.' });
    }

    const resetSecret = JWT_SECRET + customer.password;
    try {
      jwt.verify(resetToken, resetSecret);
    } catch (err) {
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thực hiện lại từ đầu.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.customer.update({
      where: { email },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Mật khẩu đã được đặt lại thành công.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.' });
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
router.post('/register', async (req, res) => {
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
