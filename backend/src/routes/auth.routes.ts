import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

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
  const { fullName, email, password } = req.body;
  
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng điền đủ thông tin.' });
  }

  try {
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing && existing.verified) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    if (existing) {
      await prisma.customer.update({
        where: { email },
        data: { fullName, password: hashedPassword, otp, otpExpiry }
      });
    } else {
      await prisma.customer.create({
        data: { fullName, email, password: hashedPassword, otp, otpExpiry }
      });
    }

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      await smtpTransporter.sendMail({
        from: `"AppleWeb" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: 'AppleWeb - Mã xác thực OTP của bạn',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:8px">
            <h2 style="color:#000;margin-bottom:16px">AppleWeb</h2>
            <p>Xin chào <strong>${fullName}</strong>,</p>
            <p>Mã xác thực (OTP) đăng ký tài khoản của bạn là:</p>
            <div style="font-size:32px;font-weight:bold;text-align:center;padding:16px;background:#99e300;color:black;border-radius:8px;letter-spacing:8px;margin:16px 0">
              ${otp}
            </div>
            <p style="color:#666;font-size:14px">Mã này có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.</p>
            <p style="color:#999;font-size:12px;margin-top:24px">— AppleWeb Team</p>
          </div>
        `
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
