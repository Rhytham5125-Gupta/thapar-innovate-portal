import { Request, Response, NextFunction } from 'express';
import WorkSubmission from '../models/WorkSubmission';
import Task from '../models/Task';
import { logAudit } from '../utils/audit';
import { createNotification, notifyAdmins } from '../utils/notification';
import { logger } from '../utils/logger';

export const submitWork = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { taskId, notes } = req.body;

    if (!taskId) {
      return res.status(400).json({ success: false, message: 'Task ID is required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify requesting user is the assignee or admin
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const isAdmin = req.user?.role === 'admin';
    const isAssignee = task.assignedTo?.toString() === userId.toString();

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ success: false, message: 'You are not authorized to submit work for this task' });
    }

    // Enforce task deadline locking for non-admins during file submission
    const isOverdue = new Date() > new Date(task.deadline);
    if (isOverdue && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Task deadline has expired. Directly uploading deliverables is locked. Please request a deadline extension and wait for administrator approval to unlock the task.',
      });
    }

    // Get files from Multer
    const reqFiles = ((req as any).files || []) as any[];
    if (!reqFiles || reqFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one file attachment is required for submission.' });
    }

    const files = reqFiles.map((file) => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`, // local path (or Cloudinary secure_url if using cloud configuration)
      type: file.mimetype,
      size: file.size,
    }));

    // Create WorkSubmission
    const submission = await WorkSubmission.create({
      taskId,
      submittedBy: userId,
      notes: notes || '',
      files,
      status: 'under-review',
    });

    // Update Task status to 'under-review'
    task.status = 'under-review';
    await task.save();

    await logAudit(req, 'submit_work', `Submitted work for task "${task.title}" (Submission ID: ${submission._id})`);

    // Notify admins via email (Work Submitted)
    await notifyAdmins(
      'Work Submitted for Review',
      `Employee ${req.user?.name} has submitted work for task "${task.title}". Notes: "${notes || 'None'}".`,
      'work_submitted',
      `/tasks/${task._id}`
    );

    return res.status(201).json({
      success: true,
      message: 'Work submitted successfully. Task is now under review.',
      submission,
      task,
    });
  } catch (error) {
    logger.error('Error in submitWork controller:', error);
    next(error);
  }
};

export const reviewSubmission = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { submissionId, action, reviewComments } = req.body;

    if (!submissionId || !action) {
      return res.status(400).json({ success: false, message: 'Submission ID and action (approve / request-changes) are required' });
    }

    if (!['approve', 'request-changes'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be approve or request-changes' });
    }

    const submission = await WorkSubmission.findById(submissionId).populate('taskId');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const task = await Task.findById(submission.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Associated task not found' });
    }

    // Auth check: Admin or Task Creator
    const isAdmin = req.user?.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user?._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only administrators or task creators can review submissions' });
    }

    const reviewerId = req.user?._id;

    if (action === 'approve') {
      submission.status = 'approved';
      submission.reviewComments = reviewComments || 'Approved';
      submission.reviewedBy = reviewerId;
      await submission.save();

      task.status = 'approved'; // Approved (Closed)
      await task.save();

      await logAudit(req, 'approve_submission', `Approved submission for task "${task.title}"`);

      // Notify Employee (Submission Approved)
      if (task.assignedTo) {
        await createNotification(
          task.assignedTo.toString(),
          'Work Submission Approved',
          `Congratulations! Your submission for task "${task.title}" has been approved. The task is now closed.`,
          'submission_status',
          `/tasks/${task._id}`
        );
      }
    } else {
      // action === 'request-changes'
      submission.status = 'changes-requested';
      submission.reviewComments = reviewComments || 'Changes requested';
      submission.reviewedBy = reviewerId;
      await submission.save();

      task.status = 'changes-requested';
      await task.save();

      await logAudit(req, 'request_changes', `Requested changes for task "${task.title}". Comments: ${reviewComments}`);

      // Notify Employee (Changes Requested)
      if (task.assignedTo) {
        await createNotification(
          task.assignedTo.toString(),
          'Revision Requested (Changes Requested)',
          `The administrator has requested changes on your submission for "${task.title}". Review Comments: "${reviewComments || 'None'}". Please upload a revised submission.`,
          'submission_status',
          `/tasks/${task._id}`
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Submission successfully marked as: ${submission.status}`,
      submission,
      task,
    });
  } catch (error) {
    logger.error('Error in reviewSubmission controller:', error);
    next(error);
  }
};

export const getSubmissionsForTask = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // RBAC check
    if (
      req.user?.role !== 'admin' &&
      task.assignedTo?.toString() !== req.user?._id.toString() &&
      task.createdBy?.toString() !== req.user?._id.toString() &&
      task.department !== req.user?.department
    ) {
      return res.status(403).json({ success: false, message: 'Access denied to task submissions history' });
    }

    const submissions = await WorkSubmission.find({ taskId })
      .populate('submittedBy', 'name email role avatar')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      submissions,
    });
  } catch (error) {
    logger.error('Error in getSubmissionsForTask controller:', error);
    next(error);
  }
};
