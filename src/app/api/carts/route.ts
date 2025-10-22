import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api-error-handler';
import { getCartService } from '@/services';
import { CartStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CartStatus | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sortBy = searchParams.get('sortBy') || 'abandonedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const cartService = getCartService();
    const result = await cartService.getCarts({
      status: status || undefined,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(
      paginatedResponse(result.carts, result.pagination)
    );
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      errorResponse(apiError.message, apiError.code),
      { status: apiError.statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cartService = getCartService();
    const cart = await cartService.createCart(body);

    return NextResponse.json(successResponse(cart, 'Cart created successfully'), {
      status: 201,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      errorResponse(apiError.message, apiError.code),
      { status: apiError.statusCode }
    );
  }
}
