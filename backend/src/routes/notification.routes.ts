import express from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();

// -------------------------------------------------------
// GET /api/notifications/my
// Notifications for authenticated staff
// -------------------------------------------------------
router.get('/my', authenticateToken, requireRoles('staff'), async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id || user.role !== 'staff') {
      return res.status(403).json({ message: 'Yêu cầu quyền nhân viên' });
    }

    let orderIds: string[] = [];
    try {
      const res: any = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Order' AND column_name = 'assignedStaffId'
        LIMIT 1;
      `;
      if (Array.isArray(res) && res.length > 0) {
        const assignedOrders = await prisma.order.findMany({
          where: { assignedStaffId: user.id },
          select: { id: true }
        });
        orderIds = assignedOrders.map(o => o.id);
      }
    } catch {
      orderIds = [];
    }

    const where: any = {
      referenceType: 'Order',
      referenceId: { in: orderIds }
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false }
    });

    res.json({
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching staff notifications:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// -------------------------------------------------------
// GET /api/notifications
// Query params:
//   limit  — số lượng (mặc định 20, max 100). Dùng limit=3 cho widget.
//   page   — trang (mặc định 1)
//   type   — filter theo loại (ORDER, REVIEW, DISPUTE, INVENTORY, CUSTOMER, PAYMENT)
// -------------------------------------------------------
router.get('/', authenticateToken, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const page  = Math.max(1, parseInt((req.query.page  as string) || '1',  10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const type  = req.query.type as string | undefined;

    const where = type ? { type } : {};

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
      unreadCount: await prisma.notification.count({ where: { isRead: false } }),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// -------------------------------------------------------
// PATCH /api/notifications/:id/read
// Đánh dấu một notification đã đọc
// -------------------------------------------------------
router.patch('/:id/read', authenticateToken, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ message: 'Đã đánh dấu đã đọc', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// -------------------------------------------------------
// PATCH /api/notifications/read-all
// Đánh dấu tất cả notifications đã đọc
// -------------------------------------------------------
router.patch('/read-all', authenticateToken, requireRoles('admin', 'superadmin'), async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
