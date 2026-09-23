import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = startOfCurrentMonth;

    // Based on user requirements, a successful order is DELIVERED and PAID
    const validStatuses = ['delivered', 'completed'];

    // --- REVENUE & ORDERS ---
    const [currentOrders, lastOrders, pendingOrdersCount] = await Promise.all([
      // Current month successful orders
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfCurrentMonth,
            lt: startOfNextMonth
          },
          status: { in: validStatuses },
          paymentStatus: { in: ['PAID', 'paid'] }
        },
        select: { totalAmount: true }
      }),
      // Last month successful orders
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lt: endOfLastMonth
          },
          status: { in: validStatuses },
          paymentStatus: { in: ['PAID', 'paid'] }
        },
        select: { totalAmount: true }
      }),
      // Pending orders (currently active pending orders)
      prisma.order.count({
        where: { status: { in: ['pending', 'PENDING', 'pending_payment', 'PENDING_PAYMENT'] } }
      })
    ]);

    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const lastRevenue = lastOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const currentOrdersCount = currentOrders.length;
    const lastOrdersCount = lastOrders.length;

    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const ordersGrowth = lastOrdersCount > 0 ? ((currentOrdersCount - lastOrdersCount) / lastOrdersCount) * 100 : 0;
    const aov = currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0;

    // --- PRODUCTS ---
    const activeProductVariants = await prisma.productVariant.findMany({
      where: {
        product: { status: 'active' }
      },
      select: { stock: true }
    });

    const totalStock = activeProductVariants.reduce((sum, v) => sum + v.stock, 0);
    const lowStockVariants = activeProductVariants.filter(v => v.stock <= 10).length;

    res.json({
      netRevenue: {
        current: currentRevenue,
        last: lastRevenue,
        growth: revenueGrowth
      },
      successfulOrders: {
        current: currentOrdersCount,
        last: lastOrdersCount,
        growth: ordersGrowth
      },
      pendingOrders: pendingOrdersCount,
      totalStock,
      lowStockVariants,
      aov
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/revenue-by-category', async (req, res) => {
  try {
    const validStatuses = ['delivered', 'completed'];
    const validPaymentStatuses = ['paid', 'PAID'];

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { in: validStatuses },
          paymentStatus: { in: validPaymentStatuses }
        }
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: {
                  include: {
                    parent: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const categoryRevenue = new Map<string, number>();

    for (const item of orderItems) {
      // Access category name through the nested relations, preferring parent if it exists
      const cat = item.variant?.product?.category;
      const categoryName = cat?.parent ? cat.parent.name : (cat?.name || 'Khác');
      const revenue = item.quantity * item.unitPrice;

      if (categoryRevenue.has(categoryName)) {
        categoryRevenue.set(categoryName, categoryRevenue.get(categoryName)! + revenue);
      } else {
        categoryRevenue.set(categoryName, revenue);
      }
    }

    let sortedCategories = Array.from(categoryRevenue.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    // Group remaining into 'Khác' if there are more than 4 items
    if (sortedCategories.length > 4) {
      const top3 = sortedCategories.slice(0, 3);
      const othersRevenue = sortedCategories.slice(3).reduce((sum, curr) => sum + curr.value, 0);

      const existingKhacIndex = top3.findIndex(c => c.label === 'Khác');
      if (existingKhacIndex >= 0) {
        top3[existingKhacIndex].value += othersRevenue;
      } else {
        top3.push({ label: 'Khác', value: othersRevenue });
      }
      sortedCategories = top3;
    }

    const colors = ["#DDEB9D", "#ACD99C", "#E0CD39", "#15919B"];
    const result = sortedCategories.map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }));

    res.json(result);

  } catch (error) {
    console.error('Error fetching revenue by category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/top-products', async (req, res) => {
  try {
    const validStatuses = ['delivered', 'completed'];
    const validPaymentStatuses = ['paid', 'PAID'];

    // We fetch all OrderItems belonging to successful orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { in: validStatuses },
          paymentStatus: { in: validPaymentStatuses }
        }
      }
    });

    // Aggregate by product name
    const productStats = new Map<string, { sales: number, revenue: number }>();

    for (const item of orderItems) {
      const name = item.productName || 'Unknown Product';
      const revenue = item.quantity * item.unitPrice;
      const sales = item.quantity;
      
      if (!productStats.has(name)) {
        productStats.set(name, { sales: 0, revenue: 0 });
      }
      const current = productStats.get(name)!;
      current.sales += sales;
      current.revenue += revenue;
    }

    // Sort by revenue descending
    const sortedProducts = Array.from(productStats.entries())
      .map(([name, stats]) => ({
        name,
        sales: stats.sales,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4); // Limit to top 4 products

    res.json(sortedProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
