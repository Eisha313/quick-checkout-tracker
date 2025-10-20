import { NextResponse } from 'next/server';
import { ApiResponse, createErrorResponse } from './api-response';
import { AppError, ValidationError, NotFoundError, ConflictError } from './errors';
import { ZodError } from 'zod';

export type ApiHandler<T = unknown> = () => Promise<NextResponse<ApiResponse<T>>>;

export async function withErrorHandler<T>(
  handler: ApiHandler<T>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return NextResponse.json(
      createErrorResponse(`Validation failed: ${messages.join(', ')}`),
      { status: 400 }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      createErrorResponse(error.message),
      { status: 400 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      createErrorResponse(error.message),
      { status: 404 }
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      createErrorResponse(error.message),
      { status: 409 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      createErrorResponse(error.message),
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json(
    createErrorResponse(message),
    { status: 500 }
  );
}

export function createApiResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  status: number = 200
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasMore: pagination.page * pagination.limit < pagination.total,
      },
    },
    { status }
  );
}
