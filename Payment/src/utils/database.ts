import { PrismaClient } from '@prisma/client';

class DatabaseManager {
  private static instance: PrismaClient;

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new PrismaClient({
        log: ['warn', 'error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      process.on('beforeExit', async () => {
        await DatabaseManager.instance.$disconnect();
      });

      process.on('SIGINT', async () => {
        await DatabaseManager.instance.$disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await DatabaseManager.instance.$disconnect();
        process.exit(0);
      });
    }

    return DatabaseManager.instance;
  }
}

export const prisma = DatabaseManager.getInstance();
