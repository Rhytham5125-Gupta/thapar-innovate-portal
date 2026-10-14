import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Task from '../models/Task';
import { logger } from '../utils/logger';

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const now = new Date();

    // 1. Core Counts
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalInterns = await User.countDocuments({ role: 'intern' });
    const totalUsers = await User.countDocuments();

    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const underReviewTasks = await Task.countDocuments({ status: 'under-review' });
    const approvedTasks = await Task.countDocuments({ status: 'approved' });
    const changesRequestedTasks = await Task.countDocuments({ status: 'changes-requested' });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: 'approved' },
      deadline: { $lt: now },
    });

    const averageCompletionPercentage =
      totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

    // 2. Chart Data: Tasks by Status Distribution
    const statusDistribution = [
      { name: 'Pending', value: pendingTasks, color: '#f59e0b' },
      { name: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
      { name: 'Completed', value: completedTasks, color: '#10b981' },
      { name: 'Under Review', value: underReviewTasks, color: '#8b5cf6' },
      { name: 'Approved (Closed)', value: approvedTasks, color: '#059669' },
      { name: 'Changes Requested', value: changesRequestedTasks, color: '#ef4444' },
    ].filter((s) => s.value > 0);

    // 3. Chart Data: Tasks by Department
    const deptAgg = await Task.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'in-progress', 'changes-requested', 'under-review']] }, 1, 0] },
          },
        },
      },
      { $project: { department: '$_id', total: 1, completed: 1, pending: 1, _id: 0 } },
    ]);

    // 4. Chart Data: Tasks by Employee (Top 10)
    const employeeTasksAgg = await Task.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'in-progress', 'changes-requested', 'under-review']] }, 1, 0] },
          },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      {
        $project: {
          name: '$employee.name',
          email: '$employee.email',
          role: '$employee.role',
          total: 1,
          completed: 1,
          pending: 1,
          _id: 0,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // 5. Chart Data: Monthly Productivity (Last 6 months)
    const monthlyProductivity = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const completedInMonth = await Task.countDocuments({
        status: 'approved',
        updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const createdInMonth = await Task.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const monthName = d.toLocaleString('default', { month: 'short' });
      monthlyProductivity.push({
        month: monthName,
        completed: completedInMonth,
        created: createdInMonth,
      });
    }

    // 6. Weekly Completion Trend (Last 8 weeks)
    const weeklyCompletionTrend = [];
    for (let i = 7; i >= 0; i--) {
      const endOfWeek = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const startOfWeek = new Date(endOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

      const completedInWeek = await Task.countDocuments({
        status: 'approved',
        updatedAt: { $gte: startOfWeek, $lte: endOfWeek },
      });

      const weekLabel = `Wk -${i}`;
      weeklyCompletionTrend.push({
        week: i === 0 ? 'This Wk' : weekLabel,
        completed: completedInWeek,
      });
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        totalInterns,
        totalUsers,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        underReviewTasks,
        approvedTasks,
        changesRequestedTasks,
        overdueTasks,
        averageCompletionPercentage,
      },
      charts: {
        statusDistribution,
        departmentDistribution: deptAgg,
        employeePerformance: employeeTasksAgg,
        monthlyProductivity,
        weeklyCompletionTrend,
      },
    });
  } catch (error) {
    logger.error('Error in getDashboardAnalytics controller:', error);
    next(error);
  }
};
