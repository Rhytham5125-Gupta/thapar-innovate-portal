import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

export const initMailer = async () => {
  try {
    if (env.SMTP_USER && env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info(`SMTP Mailer initialized using user: ${env.SMTP_USER}`);
    } else {
      logger.info('SMTP credentials not configured. Mailer running in MOCK mode (emails logged to console).');
    }
  } catch (error) {
    logger.error('Failed to initialize mailer:', error);
  }
};

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"Thapar Innovate Portal" <${env.SMTP_USER || 'no-reply@thapar.edu'}>`,
        to,
        subject,
        html,
      });
      logger.info(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return true;
    } else {
      logger.info('\n--- [MOCK EMAIL SENT] ---');
      logger.info(`To: ${to}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Body snippet:\n${html.substring(0, 300)}...`);
      logger.info('---------------------------\n');
      return true;
    }
  } catch (error) {
    logger.error(`Error sending email to ${to}:`, error);
    return false;
  }
};

// Generates standardized HTML templates for notification mailings
export const getEmailTemplate = (title: string, message: string, actionUrl?: string, actionText?: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <div style="background-color: #800000; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Thapar Institute of Engineering & Technology</h1>
        <p style="color: #fca5a5; margin: 5px 0 0 0; font-size: 14px;">Thapar Innovate - Employee Portal</p>
      </div>
      <div style="padding: 20px; color: #1f2937;">
        <h2 style="color: #111827; margin-top: 0; font-size: 18px;">${title}</h2>
        <p style="line-height: 1.6; font-size: 15px;">${message}</p>
        
        ${
          actionUrl && actionText
            ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background-color: #800000; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">${actionText}</a>
          </div>
        `
            : ''
        }
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #6b7280; font-size: 12px; text-align: center;">
          This is an automated notification from the Thapar Innovate Portal. Please do not reply directly to this email.
        </p>
      </div>
    </div>
  `;
};
