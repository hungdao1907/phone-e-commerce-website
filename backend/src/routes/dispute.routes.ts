import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// PUBLIC ENDPOINTS (CUSTOMER)
// ==========================================

// GET my complaints
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      prisma.dispute.findMany({
        where: { customerId },
        include: {
          order: { select: { orderCode: true } },
          product: { select: { name: true, image: true } },
          variant: { select: { attributes: true, colorCode: true, sku: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.dispute.count({ where: { customerId } })
    ]);

    res.json({
      complaints,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching my complaints:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single complaint detail for customer
router.get('/my/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const complaint = await prisma.dispute.findUnique({
      where: { id: getRouteParam(req.params.id) },
      include: {
        order: { select: { orderCode: true, createdAt: true } },
        product: { select: { name: true, image: true } },
        variant: { select: { attributes: true, colorCode: true, sku: true } }
      }
    });

    if (!complaint) return res.status(404).json({ message: 'Không tìm thấy khiếu nại' });
    if (complaint.customerId !== customerId) return res.status(403).json({ message: 'Không có quyền truy cập' });

    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST create complaint
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const { orderId, orderItemId, type, subject, description, images } = req.body;
    const reason = type || subject; // map type to reason

    if (!orderId || !orderItemId || !reason || !description) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Purchase Verification
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: { order: true, variant: true }
    });

    if (!orderItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong đơn hàng' });
    }

    if (orderItem.orderId !== orderId || orderItem.order.customerId !== customerId) {
      return res.status(403).json({ message: 'Bạn không có quyền khiếu nại sản phẩm này' });
    }

    if (!['completed', 'delivered'].includes(orderItem.order.status)) {
      return res.status(400).json({ message: 'Chỉ có thể khiếu nại đơn hàng đã hoàn thành' });
    }

    const productId = orderItem.variant.productId;
    const variantId = orderItem.variantId;

    // Check Duplicate active complaint
    const activeComplaints = await prisma.dispute.findMany({
      where: {
        orderItemId,
        customerId,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (activeComplaints.length > 0) {
      return res.status(400).json({ message: 'Bạn đã có một khiếu nại đang chờ xử lý cho sản phẩm này' });
    }

    const complaint = await prisma.dispute.create({
      data: {
        orderId,
        customerId,
        orderItemId,
        productId,
        variantId,
        reason,
        description,
        images: images || [],
        status: 'PENDING'
      },
      include: {
        customer: { select: { fullName: true } },
        order: { select: { orderCode: true } }
      }
    });

    // Create notification
    prisma.notification.create({
      data: {
        type: 'DISPUTE',
        title: `Khiếu nại mới từ ${complaint.customer?.fullName || 'khách hàng'}`,
        message: `Đơn hàng #${complaint.order?.orderCode} — ${complaint.reason}`,
        referenceType: 'Dispute',
        referenceId: complaint.id,
      },
    }).catch(console.error);

    res.status(201).json({ message: 'Tạo khiếu nại thành công', complaint });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET all complaints for admin
router.get('/admin', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user?.role as string)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const { status, type } = req.query;

    let whereClause: any = {};
    if (status) whereClause.status = status;
    if (type) whereClause.reason = type;

    const [complaints, total] = await Promise.all([
      prisma.dispute.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, fullName: true, email: true, phone: true } },
          order: { select: { orderCode: true } },
          product: { select: { id: true, name: true, image: true } },
          variant: { select: { sku: true, attributes: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.dispute.count({ where: whereClause })
    ]);

    res.json({
      complaints,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching admin complaints:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single complaint for admin
router.get('/admin/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user?.role as string)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const complaint = await prisma.dispute.findUnique({
      where: { id: getRouteParam(req.params.id) },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        order: { select: { orderCode: true, createdAt: true } },
        product: { select: { id: true, name: true, image: true } },
        variant: { select: { sku: true, attributes: true } }
      }
    });

    if (!complaint) return res.status(404).json({ message: 'Không tìm thấy khiếu nại' });
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching admin complaint details:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PATCH approve/reject/resolve status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user?.role as string)) {
      return res.status(403).json({ message: 'Không có quyền thực hiện hành động này' });
    }

    const { status } = req.body;
    if (!['PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const complaint = await prisma.dispute.update({
      where: { id: getRouteParam(req.params.id) },
      data: { status }
    });

    res.json({ message: `Cập nhật trạng thái thành ${status}`, complaint });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST Admin reply
router.post('/:id/reply', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user?.role as string)) {
      return res.status(403).json({ message: 'Không có quyền thực hiện hành động này' });
    }

    const { reply } = req.body;
    if (!reply) return res.status(400).json({ message: 'Nội dung phản hồi không được trống' });

    const complaint = await prisma.dispute.update({
      where: { id: getRouteParam(req.params.id) },
      data: { 
        resolution: reply,
        adminReplyAt: new Date(),
        adminReplyBy: req.user.username || req.user.id
      }
    });

    res.json({ message: 'Phản hồi thành công', complaint });
  } catch (error) {
    console.error('Error replying to complaint:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// For compatibility with old GET /api/disputes route used in older views
router.get('/', authenticateToken, async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        customer: { select: { fullName: true, email: true, phone: true } },
        order: { select: { orderCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// For compatibility with old PUT /api/disputes/:id route
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const dispute = await prisma.dispute.update({
      where: { id: getRouteParam(req.params.id) },
      data: { status, resolution }
    });
    res.json({ message: 'Cập nhật khiếu nại thành công', dispute });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
