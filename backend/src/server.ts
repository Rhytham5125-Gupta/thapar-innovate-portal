import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initMailer } from './config/mailer';
import { seedDatabase } from './utils/seeder';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    // 1. Connect to Database (falls back to memory server automatically if needed)
    await connectDB();

    // Seed default records
    await seedDatabase();

    // 2. Initialize Mailer service
    await initMailer();

    // 3. Start Express server
    const port = env.PORT;
    const server = app.listen(port, () => {
      logger.info(`Server successfully started in ${env.NODE_ENV} mode on port ${port}`);
    });

    // 4. Handle unexpected crashes/shutdowns gracefully
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
    process.exit(1);
  }
};

// Handle global uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

startServer();
