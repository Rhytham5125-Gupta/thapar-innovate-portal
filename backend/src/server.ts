import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initMailer } from './config/mailer';
import { seedDatabase } from './utils/seeder';
import { logger } from './utils/logger';

// Ensure DB connection for serverless invocations
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await connectDB();
      await seedDatabase();
      isDbInitialized = true;
    } catch (err) {
      logger.error('Error connecting/seeding database in request middleware:', err);
    }
  }
  next();
});

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Seed default records
    await seedDatabase();

    // 3. Initialize Mailer service
    await initMailer();

    // 4. Start Express server
    const port = env.PORT || 5000;
    const server = app.listen(port, () => {
      logger.info(`Server successfully started in ${env.NODE_ENV} mode on port ${port}`);
    });

    // Handle unexpected crashes/shutdowns gracefully
    process.on('unhandledRejection', (err: any) => {
      logger.error('UNHANDLED REJECTION! Shutting down...', err);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down server gracefully...');
      server.close(() => {
        logger.info('Process terminated.');
      });
    });
  } catch (error) {
    logger.error('Fatal error during server startup:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

// Handle global uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// Start local listener only if not running on Vercel serverless
if (!process.env.VERCEL) {
  startServer();
}

export default app;
