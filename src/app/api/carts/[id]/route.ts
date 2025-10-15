import { NextRequest } from 'next/server';
import { CartService } from '@/services/cart.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { validateUpdateCartInput, validateId } from '@/lib/validation';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const idValidation = validateId(params.id);
    if (!idValidation.valid) {
      return errorResponse(idValidation.errors.join(', '), 400);
    }

    const cart = await CartService.findById(params.id);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('Error fetching cart:', error);
    return errorResponse('Failed to fetch cart', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const idValidation = validateId(params.id);
    if (!idValidation.valid) {
      return errorResponse(idValidation.errors.join(', '), 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const validation = validateUpdateCartInput(body);
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '), 400);
    }

    const cart = await CartService.update(params.id, body);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('Error updating cart:', error);
    return errorResponse('Failed to update cart', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const idValidation = validateId(params.id);
    if (!idValidation.valid) {
      return errorResponse(idValidation.errors.join(', '), 400);
    }

    await CartService.delete(params.id);
    return successResponse({ message: 'Cart deleted successfully' });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('Error deleting cart:', error);
    return errorResponse('Failed to delete cart', 500);
  }
}
