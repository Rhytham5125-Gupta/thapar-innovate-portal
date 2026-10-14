import { Router } from 'express';
import { createTask, getTasks, getTaskById, updateTask, updateTaskStatus, deleteTask, claimTask } from '../controllers/task.controller';
import { protect } from '../middleware/auth';
import { checkRole } from '../middleware/role';

const router = Router();

router.use(protect);

router.post('/', checkRole(['admin', 'employee']), createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/claim', claimTask);
router.delete('/:id', checkRole(['admin']), deleteTask);

export default router;
