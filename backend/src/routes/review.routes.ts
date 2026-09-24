import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// GET reviews for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = getRouteParam(req.params.productId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const ratingFilter = parseInt(req.query.rating as string) || 0;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      productId,
      status: 'APPROVED'
    };
    if (ratingFilter > 0) {
      whereClause.rating = ratingFilter;
    }

    const baseWhereClause = { productId, status: 'APPROVED' };

    const [reviews, filteredTotal, allRatings] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, fullName: true } },
          variant: { select: { attributes: true, colorCode: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where: whereClause }),
      prisma.review.findMany({ where: baseWhereClause, select: { rating: true } })
    ]);

    const totalReviews = allRatings.length;
    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;
    
    allRatings.forEach(r => {
      ratingBreakdown[r.rating as keyof typeof ratingBreakdown]++;
      ratingSum += r.rating;
    });

    const ratingAverage = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 0;

    res.json({
      reviews: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        images: r.images,
        createdAt: r.createdAt,
        adminReply: r.adminReply,
        adminReplyAt: r.adminReplyAt,
        customer: r.customer,
        variant: r.variant,
        isVerifiedPurchase: true
      })),
      ratingSummary: {
        ratingAverage,
        reviewCount: totalReviews,
        ratingBreakdown
      },
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET purchase eligibility for current user
router.get('/eligibility/:productId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });
    const productId = getRouteParam(req.params.productId);

    // Find completed/delivered orders of this customer containing this productId
    const orders = await prisma.order.findMany({
      where: {
        customerId,
        status: { in: ['completed', 'delivered'] },
        items: {
          some: {
            variant: { productId }
          }
        }
      },
      include: {
        items: {
          where: { variant: { productId } },
          include: { variant: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (orders.length === 0) {
      return res.json({ isEligible: false, eligibleItems: [] });
    }

    // Filter out items that have already been reviewed
    const reviewedItems = await prisma.review.findMany({
      where: { customerId, productId },
      select: { orderItemId: true }
    });
    const reviewedItemIds = new Set(reviewedItems.map(r => r.orderItemId));

    const eligibleItems = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (!reviewedItemIds.has(item.id)) {
          eligibleItems.push({
            orderId: order.id,
            orderCode: order.orderCode,
            orderItemId: item.id,
            variantId: item.variantId,
            variantInfo: item.variantInfo,
            purchasedAt: order.createdAt
          });
        }
      }
    }

    res.json({
      isEligible: eligibleItems.length > 0,
      eligibleItems
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET all reviews for Admin Dashboard
router.get('/admin', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user?.role as string)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const { status, rating, productId } = req.query;

    let whereClause: any = {};
    if (status) whereClause.status = status;
    if (rating) whereClause.rating = parseInt(rating as string);
    if (productId) whereClause.productId = productId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, fullName: true, email: true } },
          product: { select: { id: true, name: true, image: true } },
          variant: { select: { sku: true, attributes: true } },
          order: { select: { orderCode: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.review.count({ where: whereClause })
    ]);

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PATCH approve/reject review
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user?.role as string)) {
      return res.status(403).json({ message: 'Không có quyền thực hiện hành động này' });
    }

    const id = getRouteParam(req.params.id);
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { status }
    });

    res.json({ message: `Cập nhật trạng thái thành ${status}`, review });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// POST Admin reply
router.post('/:id/reply', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user?.role as string)) {
      return res.status(403).json({ message: 'Không có quyền thực hiện hành động này' });
    }

    const id = getRouteParam(req.params.id);
    const { reply } = req.body;

    if (!reply) return res.status(400).json({ message: 'Nội dung phản hồi không được trống' });

    const review = await prisma.review.update({
      where: { id },
      data: { 
        adminReply: reply,
        adminReplyAt: new Date(),
        adminReplyBy: req.user.username || req.user.id
      }
    });

    res.json({ message: 'Đã thêm phản hồi', review });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ==========================================
// CUSTOMER ENDPOINTS
// ==========================================

// POST create review
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

    const { productId, variantId, orderId, orderItemId, rating, comment, images } = req.body;

    // Validate Rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });
    }

    // Verify Order belongs to Customer
    const order = await prisma.order.findUnique({ 
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.customerId !== customerId) {
      return res.status(403).json({ message: 'Bạn không có quyền đánh giá đơn hàng này' });
    }

    // Verify Order Status
    if (order.status !== 'completed' && order.status !== 'delivered') {
      return res.status(400).json({ message: 'Chỉ có thể đánh giá đơn hàng đã hoàn thành hoặc đã giao' });
    }

    // Verify OrderItem and Variant/Product integrity
    const orderItem = order.items.find(item => item.id === orderItemId);
    if (!orderItem) {
      return res.status(400).json({ message: 'Sản phẩm không thuộc đơn hàng này' });
    }
    
    if (orderItem.variantId !== variantId) {
      return res.status(400).json({ message: 'Thông tin phiên bản không khớp với đơn hàng' });
    }

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || variant.productId !== productId) {
      return res.status(400).json({ message: 'Sản phẩm không hợp lệ' });
    }

    // Check duplicate review
    const existingReview = await prisma.review.findUnique({
      where: {
        orderItemId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi' });
    }

    // Create Review
    const review = await prisma.review.create({
      data: {
        orderId,
        customerId,
        productId,
        variantId,
        orderItemId,
        rating,
        comment,
        images: Array.isArray(images) ? images : [],
        status: 'PENDING'
      },
      include: {
        customer: { select: { fullName: true } },
        order: { select: { orderCode: true } }
      }
    });

    // 🔔 Create notification for admin
    const stars = '⭐'.repeat(review.rating);
    prisma.notification.create({
      data: {
        type: 'REVIEW',
        title: `Đánh giá mới ${stars}`,
        message: `${review.customer?.fullName || 'Khách hàng'} vừa đánh giá đơn hàng #${review.order?.orderCode}${review.comment ? ': ' + review.comment.slice(0, 60) : ''}.`,
        referenceType: 'Review',
        referenceId: review.id,
      },
    }).catch(console.error);

    res.status(201).json({ message: 'Tạo đánh giá thành công. Đánh giá của bạn đang chờ duyệt.', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PATCH edit review
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.id;
    const id = getRouteParam(req.params.id);
    const { rating, comment, images } = req.body;

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

    if (existing.customerId !== customerId) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa đánh giá này' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(rating && { rating }),
        ...(comment !== undefined && { comment }),
        ...(images && { images: Array.isArray(images) ? images : [] }),
        status: 'PENDING' // Reset status so Admin can re-approve
      }
    });

    res.json({ message: 'Đã cập nhật đánh giá và đang chờ duyệt', review });
  } catch (error) {
    console.error('Error editing review:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// DELETE review
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const existing = await prisma.review.findUnique({ where: { id } });
    
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

    // Allow Admin OR Owner to delete
    if (!['admin', 'superadmin'].includes(req.user?.role as string) && existing.customerId !== req.user?.id) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa đánh giá này' });
    }

    await prisma.review.delete({ where: { id } });
    res.json({ message: 'Đã xóa đánh giá' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
