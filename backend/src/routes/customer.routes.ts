import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

// Get customer profile (Authenticated)
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
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
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Update customer profile (Authenticated)
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
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
router.get('/', async (req, res) => {
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
router.post('/', async (req, res) => {
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

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Manual cascade delete
    await prisma.review.deleteMany({ where: { customerId: id } });
    await prisma.dispute.deleteMany({ where: { customerId: id } });
    
    const orders = await prisma.order.findMany({ where: { customerId: id } });
    const orderIds = orders.map(o => o.id);
    
    if (orderIds.length > 0) {
      await prisma.invoice.deleteMany({ where: { orderId: { in: orderIds } } });
      // OrderItem has onDelete: Cascade but we can be explicit if needed, however Prisma handles it if it's in schema.
      await prisma.order.deleteMany({ where: { customerId: id } });
    }

    await prisma.customer.delete({
      where: { id }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
