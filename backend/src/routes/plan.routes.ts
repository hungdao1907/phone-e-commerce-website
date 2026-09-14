import { Router } from 'express';
import { getPlans, createPlan, updatePlan, deletePlan } from '../controllers/plan.controller';

const router = Router();

router.get('/', getPlans);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

export default router;
