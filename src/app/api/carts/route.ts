import { NextRequest, NextResponse } from 'next/server';
import { cartService, GetCartsParams, CreateCartParams } from '@/services/cart.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { CartStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const params: GetCartsParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      status: searchParams.get('status') as CartStatus | undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'totalValue' | undefined,
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | undefined,
    };

    const result = await cartService.getCarts(params);
    return NextResponse.json(successResponse(result.data, 'Carts retrieved successfully', result.pagination));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to retrieve carts', error.statusCode || 500),
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const params: CreateCartParams = {
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      items: body.items,
    };

    if (!params.customerEmail) {
      return NextResponse.json(
        errorResponse('Customer email is required', 400),
        { status: 400 }
      );
    }

    if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
      return NextResponse.json(
        errorResponse('Cart must have at least one item', 400),
        { status: 400 }
      );
    }

    const cart = await cartService.createCart(params);
    return NextResponse.json(
      successResponse(cart, 'Cart created successfully'),
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to create cart', error.statusCode || 500),
      { status: error.statusCode || 500 }
    );
  }
}
