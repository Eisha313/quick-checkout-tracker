import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentLinkService, PaymentLinkOptions } from '@/services/payment-link.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ApiError } from '@/lib/errors';
import { AbandonedCart, CartItem } from '@/types';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Parse options from request body
    let options: PaymentLinkOptions = {};
    try {
      const body = await request.json();
      options = {
        expiresInHours: body.expiresInHours,
        allowPromotionCodes: body.allowPromotionCodes,
        collectShippingAddress: body.collectShippingAddress,
        customMessage: body.customMessage,
      };
    } catch {
      // No body provided, use defaults
    }

    // Fetch the cart
    const cartData = await prisma.abandonedCart.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!cartData) {
      throw new ApiError('Cart not found', 404);
    }

    if (cartData.status === 'RECOVERED') {
      throw new ApiError('Cart has already been recovered', 400);
    }

    // Transform to our type
    const cart: AbandonedCart = {
      id: cartData.id,
      customerId: cartData.customerId,
      customerEmail: cartData.customerEmail,
      customerName: cartData.customerName || undefined,
      items: cartData.items as CartItem[],
      totalValue: cartData.totalValue.toNumber(),
      currency: cartData.currency,
      status: cartData.status as AbandonedCart['status'],
      abandonedAt: cartData.abandonedAt,
      recoveryAttempts: cartData.recoveryAttempts,
      lastRecoveryAttempt: cartData.lastRecoveryAttempt || undefined,
      recoveredAt: cartData.recoveredAt || undefined,
      createdAt: cartData.createdAt,
      updatedAt: cartData.updatedAt,
    };

    // Generate the payment link
    const paymentLink = await paymentLinkService.generatePaymentLink(cart, options);

    return successResponse(paymentLink, 'Payment link generated successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error('Error generating payment link:', error);
    return errorResponse('Failed to generate payment link', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    // Fetch the cart
    const cart = await prisma.abandonedCart.findUnique({
      where: { id },
      select: { recoveryLinkId: true },
    });

    if (!cart) {
      throw new ApiError('Cart not found', 404);
    }

    if (!cart.recoveryLinkId) {
      throw new ApiError('No active payment link for this cart', 400);
    }

    // Deactivate the payment link
    await paymentLinkService.deactivatePaymentLink(cart.recoveryLinkId);

    // Update the cart
    await prisma.abandonedCart.update({
      where: { id },
      data: {
        recoveryLinkId: null,
        recoveryLinkUrl: null,
        recoveryLinkExpiresAt: null,
      },
    });

    return successResponse(null, 'Payment link deactivated successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error.message, error.statusCode);
    }
    console.error('Error deactivating payment link:', error);
    return errorResponse('Failed to deactivate payment link', 500);
  }
}
