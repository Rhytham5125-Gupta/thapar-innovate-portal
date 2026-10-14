import { Router } from 'express';
import { submitWork, reviewSubmission, getSubmissionsForTask } from '../controllers/submission.controller';
import { protect } from '../middleware/auth';
import { checkRole } from '../middleware/role';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);

router.post('/submit', upload.array('files', 10), submitWork);
router.post('/review', checkRole(['admin', 'employee']), reviewSubmission);
router.get('/task/:taskId', getSubmissionsForTask);

export default router;
