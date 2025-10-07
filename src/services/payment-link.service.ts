import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { Cart, PaymentLink } from '@/types';
import { formatCurrency } from '@/lib/cart-utils';
import { env } from '@/lib/env';

export interface CreatePaymentLinkInput {
  cartId: string;
  expiresInHours?: number;
}

export interface PaymentLinkResult {
  url: string;
  expiresAt: Date;
  paymentLinkId: string;
}

export class PaymentLinkService {
  static async createPaymentLink(input: CreatePaymentLinkInput): Promise<PaymentLinkResult> {
    const { cartId, expiresInHours = 24 } = input;

    if (!cartId || cartId.trim() === '') {
      throw new ValidationError('Cart ID is required');
    }

    if (expiresInHours <= 0 || expiresInHours > 168) {
      throw new ValidationError('Expiration hours must be between 1 and 168');
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundError('Cart', cartId);
    }

    if (cart.status === 'recovered') {
      throw new ValidationError('Cannot create payment link for a recovered cart');
    }

    if (cart.status === 'expired') {
      throw new ValidationError('Cannot create payment link for an expired cart');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new ValidationError('Cannot create payment link for an empty cart');
    }

    if (cart.totalValue <= 0) {
      throw new ValidationError('Cart total must be greater than zero');
    }

    try {
      const lineItems = cart.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.productName,
            metadata: {
              productId: item.productId,
            },
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      }));

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const paymentLink = await stripe.paymentLinks.create({
        line_items: lineItems,
        metadata: {
          cartId: cart.id,
          customerEmail: cart.customerEmail,
        },
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${env.NEXT_PUBLIC_APP_URL}/recovery/success?cart_id=${cart.id}`,
          },
        },
      });

      await prisma.cart.update({
        where: { id: cartId },
        data: {
          stripePaymentLinkId: paymentLink.id,
          stripePaymentLinkUrl: paymentLink.url,
          status: 'pending',
        },
      });

      return {
        url: paymentLink.url,
        expiresAt,
        paymentLinkId: paymentLink.id,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Stripe payment link creation failed:', error);
      throw new AppError('Failed to create payment link', 500, 'STRIPE_ERROR');
    }
  }

  static async getPaymentLinkStatus(cartId: string): Promise<PaymentLink | null> {
    if (!cartId || cartId.trim() === '') {
      throw new ValidationError('Cart ID is required');
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      select: {
        stripePaymentLinkId: true,
        stripePaymentLinkUrl: true,
        status: true,
      },
    });

    if (!cart) {
      throw new NotFoundError('Cart', cartId);
    }

    if (!cart.stripePaymentLinkId) {
      return null;
    }

    return {
      id: cart.stripePaymentLinkId,
      url: cart.stripePaymentLinkUrl || '',
      active: cart.status === 'pending',
    };
  }

  static async deactivatePaymentLink(cartId: string): Promise<void> {
    if (!cartId || cartId.trim() === '') {
      throw new ValidationError('Cart ID is required');
    }

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      select: {
        stripePaymentLinkId: true,
      },
    });

    if (!cart) {
      throw new NotFoundError('Cart', cartId);
    }

    if (!cart.stripePaymentLinkId) {
      return;
    }

    try {
      await stripe.paymentLinks.update(cart.stripePaymentLinkId, {
        active: false,
      });

      await prisma.cart.update({
        where: { id: cartId },
        data: {
          status: 'abandoned',
        },
      });
    } catch (error) {
      console.error('Failed to deactivate payment link:', error);
      throw new AppError('Failed to deactivate payment link', 500, 'STRIPE_ERROR');
    }
  }
}
