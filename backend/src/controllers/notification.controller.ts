import { Request, Response, NextFunction } from 'express';
import Notification from '../models/Notification';
import { logger } from '../utils/logger';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    logger.error('Error in getNotifications controller:', error);
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user?._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    logger.error('Error in markAsRead controller:', error);
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user?._id;

    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Error in markAllAsRead controller:', error);
    next(error);
  }
};
