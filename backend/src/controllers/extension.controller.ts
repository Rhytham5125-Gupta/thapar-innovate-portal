import { Request, Response, NextFunction } from 'express';
import ExtensionRequest from '../models/ExtensionRequest';
import Task from '../models/Task';
import { logAudit } from '../utils/audit';
import { createNotification, notifyAdmins } from '../utils/notification';
import { logger } from '../utils/logger';

export const requestExtension = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { taskId, requestedDeadline, reason } = req.body;

    if (!taskId || !requestedDeadline || !reason) {
      return res.status(400).json({ success: false, message: 'Task ID, requested deadline, and reason are required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Verify task is not closed
    if (task.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Cannot request deadline extensions for closed tasks' });
    }

    // Auth check: User must be assignee
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const isAssignee = task.assignedTo?.toString() === userId.toString();

    if (!isAssignee) {
      return res.status(403).json({ success: false, message: 'Only the assigned employee can request a deadline extension' });
    }

    // Create ExtensionRequest
    const extRequest = await ExtensionRequest.create({
      taskId,
      requestedBy: userId,
      requestedDeadline: new Date(requestedDeadline),
      reason,
      status: 'pending',
    });

    await logAudit(req, 'request_extension', `Requested extension for task "${task.title}" to ${new Date(requestedDeadline).toLocaleString()}`);

    // Notify admins
    await notifyAdmins(
      'Deadline Extension Requested',
      `Employee ${req.user?.name} has requested a deadline extension for "${task.title}". Reason: "${reason}". Requested Deadline: ${new Date(requestedDeadline).toLocaleString()}.`,
      'extension_request',
      `/admin/extensions` // Admin panel route
    );

    return res.status(201).json({
      success: true,
      message: 'Deadline extension request submitted successfully',
      extensionRequest: extRequest,
    });
  } catch (error) {
    logger.error('Error in requestExtension controller:', error);
    next(error);
  }
};

export const reviewExtension = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { requestId, action, comments } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({ success: false, message: 'Request ID and action (approve / reject) are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be approve or reject' });
    }

    const extRequest = await ExtensionRequest.findById(requestId).populate('taskId');
    if (!extRequest) {
      return res.status(404).json({ success: false, message: 'Extension request not found' });
    }

    if (extRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Extension request has already been reviewed (${extRequest.status})` });
    }

    const task = await Task.findById(extRequest.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task associated with extension request not found' });
    }

    // Auth check: Admin or task creator
    const isAdmin = req.user?.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user?._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only administrators or task creators can review extension requests' });
    }

    if (action === 'approve') {
      extRequest.status = 'approved';
      extRequest.comments = comments || 'Approved';
      await extRequest.save();

      // Automatically update task deadline, reset status to pending, and grant edit permission
      const oldDeadline = task.deadline;
      task.deadline = extRequest.requestedDeadline;
      task.status = 'pending'; 
      task.editPermissionGranted = true; // Temporary editing permission granted
      await task.save();

      await logAudit(
        req,
        'approve_extension',
        `Approved extension for task "${task.title}" (New deadline: ${extRequest.requestedDeadline.toLocaleString()})`
      );

      // Notify employee
      await createNotification(
        extRequest.requestedBy.toString(),
        'Deadline Extension Approved',
        `Your extension request for "${task.title}" has been approved! The new deadline is ${extRequest.requestedDeadline.toLocaleString()}. You have been granted temporary editing permissions.`,
        'extension_status',
        `/tasks/${task._id}`
      );
    } else {
      // action === 'reject'
      extRequest.status = 'rejected';
      extRequest.comments = comments || 'Rejected';
      await extRequest.save();

      await logAudit(req, 'reject_extension', `Rejected extension request for task "${task.title}"`);

      // Notify employee
      await createNotification(
        extRequest.requestedBy.toString(),
        'Deadline Extension Rejected',
        `Your extension request for "${task.title}" has been rejected. The deadline remains unchanged. Admin comment: "${comments || 'No comment'}".`,
        'extension_status',
        `/tasks/${task._id}`
      );
    }

    return res.status(200).json({
      success: true,
      message: `Extension request has been ${extRequest.status}`,
      extensionRequest: extRequest,
      task,
    });
  } catch (error) {
    logger.error('Error in reviewExtension controller:', error);
    next(error);
  }
};

export const getExtensions = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?._id;

    const filter: any = {};

    // Non-admins can only see their own requests
    if (userRole !== 'admin') {
      filter.requestedBy = userId;
    }

    const extensions = await ExtensionRequest.find(filter)
      .populate('taskId', 'title deadline status')
      .populate('requestedBy', 'name email role department')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: extensions.length,
      extensions,
    });
  } catch (error) {
    logger.error('Error in getExtensions controller:', error);
    next(error);
  }
};
