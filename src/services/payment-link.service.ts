import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { AbandonedCart, CartItem } from '@/types';
import { formatCurrency, calculateCartTotal } from '@/lib/cart-utils';
import { ApiError } from '@/lib/errors';
import Stripe from 'stripe';

export interface PaymentLinkOptions {
  expiresInHours?: number;
  allowPromotionCodes?: boolean;
  collectShippingAddress?: boolean;
  customMessage?: string;
}

export interface GeneratedPaymentLink {
  id: string;
  url: string;
  expiresAt: Date | null;
  cartId: string;
  totalAmount: number;
}

const DEFAULT_EXPIRY_HOURS = 72;

export class PaymentLinkService {
  /**
   * Generate a Stripe payment link for an abandoned cart
   */
  async generatePaymentLink(
    cart: AbandonedCart,
    options: PaymentLinkOptions = {}
  ): Promise<GeneratedPaymentLink> {
    const {
      expiresInHours = DEFAULT_EXPIRY_HOURS,
      allowPromotionCodes = true,
      collectShippingAddress = false,
      customMessage,
    } = options;

    if (cart.items.length === 0) {
      throw new ApiError('Cannot create payment link for empty cart', 400);
    }

    // Create line items for Stripe
    const lineItems = await this.createLineItems(cart.items);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // Create the payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: lineItems,
      allow_promotion_codes: allowPromotionCodes,
      billing_address_collection: 'required',
      shipping_address_collection: collectShippingAddress
        ? { allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'] }
        : undefined,
      metadata: {
        cartId: cart.id,
        customerId: cart.customerId,
        customerEmail: cart.customerEmail,
        source: 'cart_recovery',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?cart_id=${cart.id}`,
        },
      },
      custom_text: customMessage
        ? {
            submit: {
              message: customMessage,
            },
          }
        : undefined,
    });

    // Update the cart with the payment link info
    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: {
        recoveryLinkId: paymentLink.id,
        recoveryLinkUrl: paymentLink.url,
        recoveryLinkExpiresAt: expiresAt,
        lastRecoveryAttempt: new Date(),
        recoveryAttempts: {
          increment: 1,
        },
      },
    });

    // Log the recovery attempt
    await prisma.recoveryAttempt.create({
      data: {
        cartId: cart.id,
        type: 'PAYMENT_LINK',
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.url,
        expiresAt,
      },
    });

    return {
      id: paymentLink.id,
      url: paymentLink.url,
      expiresAt,
      cartId: cart.id,
      totalAmount: calculateCartTotal(cart.items),
    };
  }

  /**
   * Create Stripe line items from cart items
   */
  private async createLineItems(
    items: CartItem[]
  ): Promise<Stripe.PaymentLinkCreateParams.LineItem[]> {
    const lineItems: Stripe.PaymentLinkCreateParams.LineItem[] = [];

    for (const item of items) {
      // Check if product already exists in Stripe
      let priceId = item.stripePriceId;

      if (!priceId) {
        // Create a price for this product
        const price = await stripe.prices.create({
          unit_amount: Math.round(item.price * 100), // Convert to cents
          currency: 'usd',
          product_data: {
            name: item.name,
            metadata: {
              productId: item.productId,
              sku: item.sku || '',
            },
          },
        });
        priceId = price.id;
      }

      lineItems.push({
        price: priceId,
        quantity: item.quantity,
      });
    }

    return lineItems;
  }

  /**
   * Deactivate an existing payment link
   */
  async deactivatePaymentLink(paymentLinkId: string): Promise<void> {
    await stripe.paymentLinks.update(paymentLinkId, {
      active: false,
    });
  }

  /**
   * Get payment link details
   */
  async getPaymentLinkDetails(paymentLinkId: string): Promise<Stripe.PaymentLink> {
    return stripe.paymentLinks.retrieve(paymentLinkId);
  }

  /**
   * Generate payment links in bulk for multiple carts
   */
  async generateBulkPaymentLinks(
    carts: AbandonedCart[],
    options: PaymentLinkOptions = {}
  ): Promise<GeneratedPaymentLink[]> {
    const results: GeneratedPaymentLink[] = [];
    const errors: Array<{ cartId: string; error: string }> = [];

    for (const cart of carts) {
      try {
        const link = await this.generatePaymentLink(cart, options);
        results.push(link);
      } catch (error) {
        errors.push({
          cartId: cart.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0) {
      console.error('Bulk payment link generation errors:', errors);
    }

    return results;
  }
}

export const paymentLinkService = new PaymentLinkService();
