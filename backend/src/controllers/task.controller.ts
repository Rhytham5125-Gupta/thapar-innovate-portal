import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Task, { TaskStatus } from '../models/Task';
import User from '../models/User';
import { logAudit } from '../utils/audit';
import { createNotification, notifyAdmins } from '../utils/notification';
import { logger } from '../utils/logger';
import { DEMO_TASKS } from '../utils/demoData';

// Enforce task lifecycle transition rules
const isValidTransition = (current: TaskStatus, next: TaskStatus, role: string): boolean => {
  if (role === 'admin') return true; // Admins can bypass lifecycle restrictions if needed

  const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
    'pending': ['in-progress'],
    'in-progress': ['under-review', 'completed'], // completed/under-review when work is submitted
    'completed': ['under-review'],
    'work-submitted': ['under-review'],
    'under-review': [], // Locked for admin actions (approve / request changes)
    'approved': [], // Terminal state
    'changes-requested': ['in-progress', 'under-review'],
  };

  return allowedTransitions[current]?.includes(next) || false;
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { title, description, deadline, priority, department, assignedTo, attachments } = req.body;

    if (!title || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'Title, description, and deadline are required' });
    }

    const creatorId = req.user?._id;
    const creatorDept = req.user?.department || 'Other';

    // Verify assigned employee if provided
    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(400).json({ success: false, message: 'Assigned employee not found' });
      }
    }

    const task = await Task.create({
      title,
      description,
      deadline: new Date(deadline),
      priority: priority || 'medium',
      department: department || creatorDept,
      assignedTo: assignedTo ? assignedTo : null,
      createdBy: creatorId,
      status: 'pending',
      attachments: attachments || [],
    });

    await logAudit(req, 'create_task', `Created task: ${task.title} (ID: ${task._id})`);

    // Notify admins via email (Task Created)
    await notifyAdmins(
      'New Task Created',
      `A new task titled "${task.title}" has been created in the department "${task.department}".`,
      'task_created',
      `/tasks/${task._id}`
    );

    // Notify the assigned employee/intern (New Task Assigned)
    if (assignedTo) {
      await createNotification(
        assignedTo.toString(),
        'New Task Assigned',
        `You have been assigned a new task: "${task.title}" by ${req.user?.name}. The deadline is ${new Date(deadline).toLocaleString()}.`,
        'task_assigned',
        `/tasks/${task._id}`
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error) {
    logger.error('Error in createTask controller:', error);
    next(error);
  }
};

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: DEMO_TASKS.length,
        tasks: DEMO_TASKS,
      });
    }

    const userRole = req.user?.role;
    const userId = req.user?._id;

    // Build filter object based on query params and RBAC
    const filter: any = {};

    // RBAC: Non-admins only see tasks assigned to them, created by them, or in their department
    if (userRole !== 'admin') {
      filter.$or = [
        { assignedTo: userId },
        { assignedTo: null }, // Open to everyone
        { createdBy: userId },
        { department: req.user?.department },
      ];
    }

    // Apply query filters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    // Search query
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email role avatar department')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    logger.error('Error in getTasks controller:', error);
    next(error);
  }
};

export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoTask = DEMO_TASKS.find((t) => t._id === req.params.id) || DEMO_TASKS[0];
      return res.status(200).json({
        success: true,
        task: demoTask,
      });
    }

    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email role avatar department')
      .populate('createdBy', 'name email role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const assigneeId = (task.assignedTo as any)?._id?.toString() || task.assignedTo?.toString();
    const creatorId = (task.createdBy as any)?._id?.toString() || task.createdBy?.toString();

    // RBAC Check
    if (
      req.user?.role !== 'admin' &&
      task.assignedTo !== null &&
      task.assignedTo !== undefined &&
      assigneeId !== req.user?._id.toString() &&
      creatorId !== req.user?._id.toString() &&
      task.department !== req.user?.department
    ) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not belong to this task scope.' });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    logger.error('Error in getTaskById controller:', error);
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isCreator = task.createdBy.toString() === req.user?._id.toString();
    const isAssigned = task.assignedTo?.toString() === req.user?._id.toString();
    const isAdmin = req.user?.role === 'admin';
    const isEmployee = req.user?.role === 'employee';

    // Allow Admin, Task Creator, Assigned Employee with editPermissionGranted,
    // OR Employee assigning/delegating (is assigned, creator, task is unassigned, or in their department)
    const canEmployeeAssign = isEmployee && (isAssigned || isCreator || !task.assignedTo || task.department === req.user?.department);

    // Check permissions
    if (!isAdmin && !isCreator && !(isAssigned && task.editPermissionGranted) && !canEmployeeAssign) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this task. Task edit requires Admin permission, creator access, or delegation rights.',
      });
    }

    const { title, description, deadline, priority, department, assignedTo, attachments } = req.body;

    // Prevent non-admin/creator from changing deadline, priority, or department
    if (!isAdmin && !isCreator) {
      if (deadline || priority || department) {
        return res.status(403).json({
          success: false,
          message: 'Only administrators or the task creator can modify deadline, priority, or department.',
        });
      }
      if (assignedTo !== undefined && !canEmployeeAssign) {
        return res.status(403).json({
          success: false,
          message: 'As an assignee with temporary edit access, you can only modify description, title, or attachments.',
        });
      }
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (deadline && (isAdmin || isCreator)) task.deadline = new Date(deadline);
    if (priority && (isAdmin || isCreator)) task.priority = priority;
    if (department && (isAdmin || isCreator)) task.department = department;
    
    if (assignedTo !== undefined) {
      if (assignedTo) {
        const assignedUser = await User.findById(assignedTo);
        if (!assignedUser) {
          return res.status(400).json({ success: false, message: 'Assigned employee/intern not found' });
        }
      }
      task.assignedTo = assignedTo ? assignedTo : undefined;
    }
    if (attachments) task.attachments = attachments;

    // Reset temporary edit permissions once edited by assignee
    if (isAssigned && task.editPermissionGranted) {
      task.editPermissionGranted = false;
    }

    await task.save();
    await logAudit(req, 'update_task', `Updated task details: ${task.title}`);

    // Notify assigned user if modified by another party
    if (task.assignedTo && task.assignedTo.toString() !== req.user?._id.toString()) {
      await createNotification(
        task.assignedTo.toString(),
        'Task Assigned / Updated',
        `Task "${task.title}" has been assigned to you or updated by ${req.user?.name}.`,
        'task_assigned',
        `/tasks/${task._id}`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task,
    });
  } catch (error) {
    logger.error('Error in updateTask controller:', error);
    next(error);
  }
};

export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { status: nextStatus } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const isAssigned = task.assignedTo?.toString() === req.user?._id.toString();
    const isAdmin = req.user?.role === 'admin';
    const isCreator = task.createdBy.toString() === req.user?._id.toString();

    // Enforce task deadline locking for non-admins
    const isOverdue = new Date() > new Date(task.deadline);
    if (isOverdue && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Task deadline has expired. Direct status updates are locked. Please request a deadline extension and wait for administrator approval.',
      });
    }

    // Check authority: Admin, Creator, or Assigned Employee
    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this task status' });
    }

    // Validate lifecycle transitions
    if (!isValidTransition(task.status, nextStatus, req.user?.role || '')) {
      return res.status(400).json({
        success: false,
        message: `Invalid task status transition from '${task.status}' to '${nextStatus}'.`,
      });
    }

    const oldStatus = task.status;
    task.status = nextStatus;
    await task.save();

    await logAudit(req, 'update_task_status', `Updated task status from ${oldStatus} to ${nextStatus} for ${task.title}`);

    // Send notifications
    if (isAdmin || isCreator) {
      // Notify assigned user of admin action
      if (task.assignedTo) {
        await createNotification(
          task.assignedTo.toString(),
          'Task Status Changed',
          `The status of your task "${task.title}" was set to "${nextStatus}" by ${req.user?.name}.`,
          'task_status',
          `/tasks/${task._id}`
        );
      }
    } else {
      // Assigned user updating status: notify admins
      await notifyAdmins(
        'Task Status Updated',
        `Employee ${req.user?.name} has updated the status of "${task.title}" to "${nextStatus}".`,
        'task_status',
        `/tasks/${task._id}`
      );
    }

    return res.status(200).json({
      success: true,
      message: `Task status updated to ${nextStatus}`,
      task,
    });
  } catch (error) {
    logger.error('Error in updateTaskStatus controller:', error);
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const taskTitle = task.title;
    const assignedId = task.assignedTo?.toString();

    await Task.findByIdAndDelete(req.params.id);
    await logAudit(req, 'delete_task', `Deleted task: ${taskTitle}`);

    if (assignedId) {
      await createNotification(
        assignedId,
        'Task Deleted',
        `The task "${taskTitle}" assigned to you has been deleted.`,
        'task_deleted'
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteTask controller:', error);
    next(error);
  }
};

export const claimTask = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.assignedTo) {
      return res.status(400).json({ success: false, message: 'Task is already assigned to someone else' });
    }

    // Assign to requesting user
    task.assignedTo = req.user?._id;
    // Task status remains in-progress
    task.status = 'in-progress';
    await task.save();

    await logAudit(req, 'claim_task', `Claimed task: ${task.title}`);

    // Notify admins that the task has been claimed
    await notifyAdmins(
      'Task Claimed',
      `Employee/Intern ${req.user?.name} has claimed the task "${task.title}".`,
      'task_assigned',
      `/tasks/${task._id}`
    );

    return res.status(200).json({
      success: true,
      message: 'Task claimed successfully',
      task,
    });
  } catch (error) {
    logger.error('Error in claimTask controller:', error);
    next(error);
  }
};
