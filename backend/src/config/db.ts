import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';
import { logger } from '../utils/logger';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    let dbUri = env.MONGODB_URI;

    if (!dbUri) {
      if (process.env.VERCEL) {
        logger.error('CRITICAL: MONGODB_URI is not set in Vercel environment variables! Persistent database connection is required.');
        return;
      }
      logger.info('No MONGODB_URI configured. Initializing mongodb-memory-server...');
      mongoMemoryServer = await MongoMemoryServer.create();
      dbUri = mongoMemoryServer.getUri();
      logger.info(`In-memory database initialized at: ${dbUri}`);
    }

    if (dbUri) {
      mongoose.set('strictQuery', true);
      await mongoose.connect(dbUri);
      logger.info('Database connection established successfully.');
    }
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
  }
};

export const closeDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      logger.info('In-memory database server stopped.');
    }
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Error during database teardown:', error);
  }
};
