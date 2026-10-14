import { Request } from 'express';
import AuditLog from '../models/AuditLog';
import { logger } from './logger';

export const logAudit = async (
  req: Request,
  action: string,
  details: string
): Promise<void> => {
  try {
    const userId = req.user?._id;
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await AuditLog.create({
      user: userId,
      action,
      details,
      ipAddress,
      userAgent,
    });
    logger.debug(`Audit logged: [${action}] - ${details}`);
  } catch (error) {
    logger.error(`Failed to write audit log for action [${action}]:`, error);
  }
};
