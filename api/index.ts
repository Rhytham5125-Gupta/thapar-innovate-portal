import app from '../backend/src/app';
import { connectDB } from '../backend/src/config/db';
import { seedDatabase } from '../backend/src/utils/seeder';

let isSeeded = false;

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    if (!isSeeded) {
      await seedDatabase();
      isSeeded = true;
    }
  } catch (error) {
    console.error('Database connection / seeding error in serverless handler:', error);
  }

  return app(req, res);
}
