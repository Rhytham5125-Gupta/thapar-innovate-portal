import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { protect } from '../middleware/auth';
import { checkRole } from '../middleware/role';

const router = Router();

router.use(protect);
router.use(checkRole(['admin']));

router.get('/', getAuditLogs);

export default router;
