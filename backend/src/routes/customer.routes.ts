import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { createCustomerDeleteHandler } from './customer-delete.handler';
import { safeErrorSummary } from '../utils/safe-error-summary';

const router = express.Router();

// Get customer profile (Authenticated)
router.get('/profile', authenticateToken, requireRoles('customer'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: req.user.id }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    }

    const { password: _, otp, otpExpiry, ...safeCustomer } = customer;
    res.json(safeCustomer);
  } catch (error) {
    console.error('Error fetching profile:', safeErrorSummary(error));
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Update customer profile (Authenticated)
router.put('/profile', authenticateToken, requireRoles('customer'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const { fullName, phone, address } = req.body;

    const updatedCustomer = await prisma.customer.update({
      where: { id: req.user.id },
      data: { fullName, phone, address }
    });

    const { password: _, otp, otpExpiry, ...safeCustomer } = updatedCustomer;
    res.json({ message: 'Cập nhật thành công', customer: safeCustomer });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Get all customers
router.get('/', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        address: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
        Order: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new customer
router.post('/', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    const { fullName, email, password, phone, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Tên, email và mật khẩu là bắt buộc' });
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    });

    if (existingCustomer) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);



    const customer = await prisma.customer.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phone,
        address
      }
    });

    const { password: _, otp, otpExpiry, ...safeCustomer } = customer;
    res.status(201).json({
      message: 'Customer created successfully',
      customer: safeCustomer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Preserve the existing Staff/Admin authorization contract; the handler only
// deletes customers without dependent or historical records.
router.delete('/:id', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), createCustomerDeleteHandler(prisma));

export default router;
