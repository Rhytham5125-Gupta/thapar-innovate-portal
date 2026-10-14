import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import { logger } from '../utils/logger';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (req.query.action) {
      filter.action = req.query.action;
    }
    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      logs,
    });
  } catch (error) {
    logger.error('Error in getAuditLogs controller:', error);
    next(error);
  }
};
