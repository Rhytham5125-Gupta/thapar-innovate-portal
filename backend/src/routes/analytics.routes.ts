import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/analytics.controller';
import { protect } from '../middleware/auth';
import { checkRole } from '../middleware/role';

const router = Router();

router.use(protect);
router.use(checkRole(['admin']));

router.get('/dashboard', getDashboardAnalytics);

export default router;
