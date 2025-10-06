import { NextRequest, NextResponse } from 'next/server';
import { cartService, UpdateCartParams } from '@/services/cart.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { CartStatus } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cart = await cartService.getCartById(params.id);
    return NextResponse.json(successResponse(cart, 'Cart retrieved successfully'));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to retrieve cart', error.statusCode || 500),
      { status: error.statusCode || 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const updateParams: UpdateCartParams = {};

    if (body.status) {
      const validStatuses: CartStatus[] = ['ACTIVE', 'ABANDONED', 'RECOVERED', 'CONVERTED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          errorResponse('Invalid cart status', 400),
          { status: 400 }
        );
      }
      updateParams.status = body.status;
    }

    if (body.customerName !== undefined) {
      updateParams.customerName = body.customerName;
    }

    if (body.items) {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return NextResponse.json(
          errorResponse('Cart must have at least one item', 400),
          { status: 400 }
        );
      }
      updateParams.items = body.items;
    }

    const cart = await cartService.updateCart(params.id, updateParams);
    return NextResponse.json(successResponse(cart, 'Cart updated successfully'));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to update cart', error.statusCode || 500),
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await cartService.deleteCart(params.id);
    return NextResponse.json(successResponse(null, 'Cart deleted successfully'));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to delete cart', error.statusCode || 500),
      { status: error.statusCode || 500 }
    );
  }
}
