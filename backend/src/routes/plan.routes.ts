import { Router } from 'express';
import { getPlans, getAssignedPlans, createPlan, updatePlan, deletePlan } from '../controllers/plan.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';

const router = Router();

router.get('/assigned', authenticateToken, requireRoles('staff'), getAssignedPlans);
router.get('/', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), getPlans);
router.post('/', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), createPlan);
router.put('/:id', authenticateToken, requireRoles('staff', 'admin', 'superadmin'), updatePlan);
router.delete('/:id', authenticateToken, requireRoles('admin', 'superadmin'), deletePlan);

export default router;
