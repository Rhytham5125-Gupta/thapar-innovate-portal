import { Router } from 'express';
import { requestExtension, reviewExtension, getExtensions } from '../controllers/extension.controller';
import { protect } from '../middleware/auth';
import { checkRole } from '../middleware/role';

const router = Router();

router.use(protect);

router.post('/request', requestExtension);
router.post('/review', checkRole(['admin']), reviewExtension);
router.get('/', getExtensions);

export default router;
