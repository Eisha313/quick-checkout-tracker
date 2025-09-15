import { PrismaClient } from '@prisma/client';
import { DatabaseError } from './errors';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

  // Add middleware for error handling
  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      console.error(`Prisma error on ${params.model}.${params.action}:`, error);
      
      if (error instanceof Error) {
        // Handle specific Prisma errors
        if (error.message.includes('connect')) {
          throw new DatabaseError('Unable to connect to database');
        }
        if (error.message.includes('unique constraint')) {
          throw new DatabaseError('Record already exists');
        }
        if (error.message.includes('foreign key constraint')) {
          throw new DatabaseError('Referenced record does not exist');
        }
      }
      
      throw new DatabaseError('Database operation failed');
    }
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

export default prisma;
