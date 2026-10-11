import express from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { isAdminRole, leadScopeForPrincipal } from '../middleware/authorization.policy';
import { getRouteParam } from '../utils/route-param';

const router = express.Router();

class LeadHistoryConflict extends Error {}

// Staff can only see leads assigned to their exact User.id; admins can see all.
router.get('/', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const principal = req.user!;
    const scope = leadScopeForPrincipal(principal);
    if (!scope) return res.status(403).json({ message: 'Bạn không có quyền xem lead.' });

    const leads = await prisma.lead.findMany({
      where: scope,
      orderBy: { createdAt: 'desc' },
      include: { interactions: { orderBy: { createdAt: 'desc' } } },
    });
    return res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Public lead intake remains available, but callers cannot choose the assignee.
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, source, interestedIn } = req.body;
    if (!fullName) return res.status(400).json({ message: 'Tên khách hàng là bắt buộc' });

    const lead = await prisma.lead.create({
      data: {
        fullName,
        email,
        phone,
        source: source || 'Khác',
        interestedIn,
        assignedTo: null,
      },
    });
    return res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Staff may update only an assigned lead and cannot reassign it; admins may update all fields.
router.put('/:id', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const principal = req.user!;
    const scope = leadScopeForPrincipal(principal);
    if (!scope) return res.status(403).json({ message: 'Bạn không có quyền cập nhật lead.' });

    const { fullName, email, phone, source, status, leadScore, interestedIn } = req.body;
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries({ fullName, email, phone, source, status, leadScore, interestedIn })) {
      if (value !== undefined) data[key] = value;
    }

    if (isAdminRole(principal.role) && Object.prototype.hasOwnProperty.call(req.body, 'assignedTo')) {
      const assignedTo = req.body.assignedTo;
      if (assignedTo !== null && typeof assignedTo !== 'string') {
        return res.status(400).json({ message: 'assignedTo phải là chuỗi hoặc null.' });
      }
      data.assignedTo = assignedTo;
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật.' });

    const result = await prisma.lead.updateMany({
      where: { id, ...scope },
      data: data as any,
    });
    if (result.count === 0) return res.status(404).json({ message: 'Không tìm thấy lead.' });

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { interactions: { orderBy: { createdAt: 'desc' } } },
    });
    return res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/interactions', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const principal = req.user!;
    const scope = leadScopeForPrincipal(principal);
    if (!scope) return res.status(403).json({ message: 'Bạn không có quyền thêm tương tác.' });

    const { type, content } = req.body;
    if (typeof type !== 'string' || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'type và content là bắt buộc.' });
    }

    const assignedLead = await prisma.lead.findFirst({
      where: { id, ...scope },
      select: { id: true },
    });
    if (!assignedLead) return res.status(404).json({ message: 'Không tìm thấy lead.' });

    const interaction = await prisma.leadInteraction.create({
      data: {
        leadId: assignedLead.id,
        type,
        content,
        createdBy: typeof principal.username === 'string' ? principal.username : String(principal.id),
      },
    });
    return res.status(201).json(interaction);
  } catch (error) {
    console.error('Error creating interaction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    const id = getRouteParam(req.params.id);
    const principal = req.user!;
    const scope = leadScopeForPrincipal(principal);
    if (!scope) return res.status(403).json({ message: 'Bạn không có quyền xóa lead.' });

    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({
        where: { id, ...scope },
        select: { id: true, interactions: { select: { id: true }, take: 1 } },
      });
      if (!lead) return { count: 0 };
      if (lead.interactions.length > 0) throw new LeadHistoryConflict('Lead has interaction history.');
      return tx.lead.deleteMany({ where: { id, ...scope } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result.count === 0) return res.status(404).json({ message: 'Không tìm thấy lead.' });

    return res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    if (error instanceof LeadHistoryConflict || (error && typeof error === 'object' && 'code' in error && error.code === 'P2003')) {
      return res.status(409).json({ message: 'Cannot delete a lead with interaction history; retain it to preserve its service history.' });
    }
    console.error('Error deleting lead:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
