import express from 'express';
import prisma from '../config/prisma';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { invoiceScopeForPrincipal } from '../middleware/authorization.policy';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();

// GET all invoices
router.get('/', authenticateToken, requireRoles('customer', 'staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    const scope = invoiceScopeForPrincipal((req as any).user);
    if (!scope) return res.status(403).json({ message: 'Bạn không có quyền xem hóa đơn.' });

    const invoices = await prisma.invoice.findMany({
      where: scope,
      include: {
        order: {
          include: {
            customer: { select: { id: true, fullName: true, email: true, phone: true, address: true } },
            items: true
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single invoice
router.get('/:id', authenticateToken, requireRoles('customer', 'staff', 'admin', 'superadmin'), async (req, res) => {
  try {
    const scope = invoiceScopeForPrincipal((req as any).user);
    if (!scope) return res.status(403).json({ message: 'Bạn không có quyền xem hóa đơn.' });

    const invoice = await prisma.invoice.findFirst({
      where: { id: getRouteParam(req.params.id), ...scope },
      include: {
        order: {
          include: {
            customer: { select: { id: true, fullName: true, email: true, phone: true, address: true } },
            items: true
          }
        }
      }
    });
    if (!invoice) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
