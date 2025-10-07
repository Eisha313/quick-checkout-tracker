import { prisma } from '@/lib/prisma';
import { Cart, CartStatus } from '@/types';
import { AppError, NotFoundError, ValidationError } from '@/lib/errors';
import { calculateCartTotal, isCartExpired } from '@/lib/cart-utils';
import { CART_EXPIRY_DAYS } from '@/lib/constants';

export interface CreateCartInput {
  customerEmail: string;
  customerName?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateCartInput {
  customerEmail?: string;
  customerName?: string;
  status?: CartStatus;
  items?: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CartFilters {
  status?: CartStatus;
  minValue?: number;
  maxValue?: number;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateCartItems(items: CreateCartInput['items']): void {
  if (!items || items.length === 0) {
    throw new ValidationError('Cart must have at least one item');
  }

  for (const item of items) {
    if (!item.productId || item.productId.trim() === '') {
      throw new ValidationError('Each item must have a valid productId');
    }
    if (!item.productName || item.productName.trim() === '') {
      throw new ValidationError('Each item must have a valid productName');
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new ValidationError('Item quantity must be a positive integer');
    }
    if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
      throw new ValidationError('Item unitPrice must be a non-negative number');
    }
  }
}

export class CartService {
  static async createCart(input: CreateCartInput): Promise<Cart> {
    if (!input.customerEmail || !validateEmail(input.customerEmail)) {
      throw new ValidationError('Valid customer email is required');
    }

    validateCartItems(input.items);

    const totalValue = calculateCartTotal(input.items);

    const cart = await prisma.cart.create({
      data: {
        customerEmail: input.customerEmail.toLowerCase().trim(),
        customerName: input.customerName?.trim() || null,
        status: 'abandoned',
        totalValue,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId.trim(),
            productName: item.productName.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return cart as Cart;
  }

  static async getCartById(id: string): Promise<Cart> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Cart ID is required');
    }

    const cart = await prisma.cart.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new NotFoundError('Cart', id);
    }

    return cart as Cart;
  }

  static async updateCart(id: string, input: UpdateCartInput): Promise<Cart> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Cart ID is required');
    }

    const existingCart = await this.getCartById(id);

    if (existingCart.status === 'recovered') {
      throw new ValidationError('Cannot update a recovered cart');
    }

    if (input.customerEmail && !validateEmail(input.customerEmail)) {
      throw new ValidationError('Valid customer email is required');
    }

    if (input.items) {
      validateCartItems(input.items);
    }

    const updateData: Record<string, unknown> = {};

    if (input.customerEmail) {
      updateData.customerEmail = input.customerEmail.toLowerCase().trim();
    }
    if (input.customerName !== undefined) {
      updateData.customerName = input.customerName?.trim() || null;
    }
    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'recovered') {
        updateData.recoveredAt = new Date();
      }
    }

    if (input.items) {
      await prisma.cartItem.deleteMany({
        where: { cartId: id },
      });

      updateData.totalValue = calculateCartTotal(input.items);
      updateData.items = {
        create: input.items.map((item) => ({
          productId: item.productId.trim(),
          productName: item.productName.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };
    }

    const cart = await prisma.cart.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return cart as Cart;
  }

  static async deleteCart(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Cart ID is required');
    }

    const existingCart = await prisma.cart.findUnique({
      where: { id },
    });

    if (!existingCart) {
      throw new NotFoundError('Cart', id);
    }

    await prisma.cart.delete({
      where: { id },
    });
  }

  static async listCarts(filters: CartFilters = {}): Promise<{ carts: Cart[]; total: number }> {
    const { status, minValue, maxValue, fromDate, toDate, page = 1, limit = 20 } = filters;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (minValue !== undefined || maxValue !== undefined) {
      where.totalValue = {};
      if (minValue !== undefined && minValue >= 0) {
        (where.totalValue as Record<string, number>).gte = minValue;
      }
      if (maxValue !== undefined && maxValue >= 0) {
        (where.totalValue as Record<string, number>).lte = maxValue;
      }
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        (where.createdAt as Record<string, Date>).gte = fromDate;
      }
      if (toDate) {
        (where.createdAt as Record<string, Date>).lte = toDate;
      }
    }

    const [carts, total] = await Promise.all([
      prisma.cart.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      }),
      prisma.cart.count({ where }),
    ]);

    return {
      carts: carts as Cart[],
      total,
    };
  }

  static async getAbandonedCarts(): Promise<Cart[]> {
    const carts = await prisma.cart.findMany({
      where: {
        status: 'abandoned',
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return carts.filter((cart) => !isCartExpired(new Date(cart.createdAt), CART_EXPIRY_DAYS)) as Cart[];
  }

  static async markAsRecovered(id: string, paymentIntentId?: string): Promise<Cart> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Cart ID is required');
    }

    const existingCart = await this.getCartById(id);

    if (existingCart.status === 'recovered') {
      throw new ValidationError('Cart is already marked as recovered');
    }

    const cart = await prisma.cart.update({
      where: { id },
      data: {
        status: 'recovered',
        recoveredAt: new Date(),
        stripePaymentIntentId: paymentIntentId || existingCart.stripePaymentIntentId,
      },
      include: {
        items: true,
      },
    });

    return cart as Cart;
  }

  static async cleanupExpiredCarts(): Promise<number> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - CART_EXPIRY_DAYS);

    const result = await prisma.cart.updateMany({
      where: {
        status: 'abandoned',
        createdAt: {
          lt: expiryDate,
        },
      },
      data: {
        status: 'expired',
      },
    });

    return result.count;
  }
}
