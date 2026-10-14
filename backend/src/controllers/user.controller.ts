import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Task from '../models/Task';
import AuditLog from '../models/AuditLog';
import { logAudit } from '../utils/audit';
import { logger } from '../utils/logger';

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const filter: any = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    const users = await User.find(filter).select('-password').sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    logger.error('Error in getUsers controller:', error);
    next(error);
  }
};

export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.params.id || req.user?._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Task stats calculations
    const now = new Date();
    const tasks = await Task.find({ assignedTo: userId });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'approved').length;
    const pendingTasks = tasks.filter((t) => ['pending', 'in-progress', 'changes-requested'].includes(t.status)).length;
    
    // Overdue: not closed (approved) AND deadline is in the past
    const overdueTasks = tasks.filter((t) => t.status !== 'approved' && new Date(t.deadline) < now).length;

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get recent activity
    const recentActivity = await AuditLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
      },
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionPercentage,
      },
      activity: recentActivity,
    });
  } catch (error) {
    logger.error('Error in getUserProfile controller:', error);
    next(error);
  }
};

export const updateUserRoleAndStatus = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { userId, role, status, department } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent modifying oneself
    if (user._id.toString() === req.user?._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot modify your own role or status' });
    }

    if (role) user.role = role;
    if (status) user.status = status;
    if (department) user.department = department;

    await user.save();
    await logAudit(
      req,
      'admin_update_user',
      `Admin updated user ${user.email} (Role: ${user.role}, Status: ${user.status}, Dept: ${user.department})`
    );

    return res.status(200).json({
      success: true,
      message: 'User settings updated successfully',
      user,
    });
  } catch (error) {
    logger.error('Error in updateUserRoleAndStatus controller:', error);
    next(error);
  }
};
