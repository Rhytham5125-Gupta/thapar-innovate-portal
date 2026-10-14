import { Router } from 'express';
import { getDepartments, createDepartment, deleteDepartment } from '../controllers/department.controller';
import { protect } from '../middleware/auth';
import { checkRole } from '../middleware/role';

const router = Router();

router.use(protect);

router.get('/', getDepartments);
router.post('/', checkRole(['admin']), createDepartment);
router.delete('/:id', checkRole(['admin']), deleteDepartment);

export default router;
