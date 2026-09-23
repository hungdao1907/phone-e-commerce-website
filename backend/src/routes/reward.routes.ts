import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all milestones
router.get('/', async (req: Request, res: Response) => {
  try {
    const milestones = await prisma.rewardMilestone.findMany({
      orderBy: {
        amount: 'asc'
      }
    });
    res.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// Create a new milestone
router.post('/', async (req: Request, res: Response) => {
  try {
    const { amount, label, type, discount, isActive } = req.body;
    
    if (!amount || !label || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newMilestone = await prisma.rewardMilestone.create({
      data: {
        amount: Number(amount),
        label,
        type,
        discount: discount ? Number(discount) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    
    res.status(201).json(newMilestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// Update a milestone
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, label, type, discount, isActive } = req.body;
    
    const updatedMilestone = await prisma.rewardMilestone.update({
      where: { id: id as string },
      data: {
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(label !== undefined && { label }),
        ...(type !== undefined && { type }),
        ...(discount !== undefined && { discount: discount ? Number(discount) : null }),
        ...(isActive !== undefined && { isActive })
      }
    });
    
    res.json(updatedMilestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Delete a milestone
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.rewardMilestone.delete({
      where: { id: id as string }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

export default router;
