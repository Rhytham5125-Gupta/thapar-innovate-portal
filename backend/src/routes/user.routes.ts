import { Router } from 'express';
import { getUsers, getUserProfile, updateUserRoleAndStatus } from '../controllers/user.controller';
import { protect } from '../middleware/auth';
import { checkRole } from '../middleware/role';

const router = Router();

router.use(protect);

router.get('/', getUsers);
router.get('/profile', getUserProfile);
router.get('/profile/:id', getUserProfile);
router.put('/update-settings', checkRole(['admin']), updateUserRoleAndStatus);

export default router;
