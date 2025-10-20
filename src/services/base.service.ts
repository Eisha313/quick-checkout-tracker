import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

export abstract class BaseService {
  protected prisma = prisma;

  protected async ensureExists<T>(
    query: Promise<T | null>,
    entityName: string,
    id: string
  ): Promise<T> {
    const result = await query;
    if (!result) {
      throw new NotFoundError(`${entityName} with id ${id} not found`);
    }
    return result;
  }

  protected handleDatabaseError(error: unknown, operation: string): never {
    console.error(`Database error during ${operation}:`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to ${operation}`);
  }

  protected buildPaginationParams(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  protected buildOrderByParams(
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    return { [sortBy]: sortOrder };
  }
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
