import Notification from '../models/Notification';
import User from '../models/User';
import { sendEmail, getEmailTemplate } from '../config/mailer';
import { logger } from './logger';

export const createNotification = async (
  recipientId: string,
  title: string,
  message: string,
  type: string,
  link?: string
): Promise<any> => {
  try {
    // 1. In-app notification
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link,
    });

    // 2. Email alert
    const user = await User.findById(recipientId);
    if (user && user.email) {
      const emailHtml = getEmailTemplate(
        title,
        message,
        link ? `http://localhost:5173${link}` : undefined,
        link ? 'View in Portal' : undefined
      );
      await sendEmail(user.email, title, emailHtml);
    }

    return notification;
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

export const notifyAdmins = async (
  title: string,
  message: string,
  type: string,
  link?: string
): Promise<void> => {
  try {
    const admins = await User.find({ role: 'admin', status: 'active' });
    
    if (admins.length === 0) {
      logger.warn('No active admins found to receive notifications.');
      return;
    }

    const promises = admins.map(async (admin) => {
      // 1. In-app
      await Notification.create({
        recipient: admin._id,
        title,
        message,
        type,
        link,
      });

      // 2. Email
      if (admin.email) {
        const emailHtml = getEmailTemplate(
          title,
          message,
          link ? `http://localhost:5173${link}` : undefined,
          link ? 'View in Portal' : undefined
        );
        await sendEmail(admin.email, title, emailHtml);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    logger.error('Error sending notification to admins:', error);
  }
};
