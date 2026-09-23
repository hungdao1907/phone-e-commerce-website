import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all leads
router.get('/', async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: { interactions: { orderBy: { createdAt: 'desc' } } }
    });
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create lead
router.post('/', async (req, res) => {
  try {
    const { fullName, email, phone, source, interestedIn, assignedTo } = req.body;
    
    if (!fullName) {
      return res.status(400).json({ message: 'Tên khách hàng là bắt buộc' });
    }

    const lead = await prisma.lead.create({
      data: {
        fullName,
        email,
        phone,
        source: source || 'Khác',
        interestedIn,
        assignedTo
      }
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update lead
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, source, status, leadScore, interestedIn, assignedTo } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: { fullName, email, phone, source, status, leadScore, interestedIn, assignedTo }
    });

    res.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add interaction
router.post('/:id/interactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, content, createdBy } = req.body;

    const interaction = await prisma.leadInteraction.create({
      data: {
        leadId: id,
        type,
        content,
        createdBy
      }
    });

    res.status(201).json(interaction);
  } catch (error) {
    console.error('Error creating interaction:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lead.delete({ where: { id } });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
