import { prisma } from '@/lib/prisma';
import { Cart, CartStatus, CartWithItems, PaginatedResponse } from '@/types';
import { AppError, NotFoundError } from '@/lib/errors';
import { calculateCartTotal, calculateCartItemCount, isCartExpired } from '@/lib/cart-utils';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/constants';

export interface GetCartsParams {
  page?: number;
  limit?: number;
  status?: CartStatus;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalValue';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCartParams {
  customerEmail: string;
  customerName?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }[];
}

export interface UpdateCartParams {
  status?: CartStatus;
  customerName?: string;
  items?: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }[];
}

class CartService {
  async getCarts(params: GetCartsParams = {}): Promise<PaginatedResponse<Cart>> {
    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const take = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * take;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [carts, total] = await Promise.all([
      prisma.cart.findMany({
        where,
        include: { items: true },
        orderBy,
        take,
        skip,
      }),
      prisma.cart.count({ where }),
    ]);

    return {
      data: carts as Cart[],
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async getCartById(id: string): Promise<CartWithItems> {
    const cart = await prisma.cart.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!cart) {
      throw new NotFoundError('Cart');
    }

    return cart as CartWithItems;
  }

  async getAbandonedCarts(): Promise<Cart[]> {
    const carts = await prisma.cart.findMany({
      where: { status: 'ABANDONED' },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    });

    return carts as Cart[];
  }

  async createCart(params: CreateCartParams): Promise<CartWithItems> {
    const { customerEmail, customerName, items } = params;

    if (!items.length) {
      throw new AppError('Cart must have at least one item', 400);
    }

    const totalValue = calculateCartTotal(
      items.map((item) => ({ ...item, id: '', cartId: '', createdAt: new Date(), updatedAt: new Date() }))
    );

    const cart = await prisma.cart.create({
      data: {
        customerEmail,
        customerName,
        totalValue,
        itemCount: calculateCartItemCount(
          items.map((item) => ({ ...item, id: '', cartId: '', createdAt: new Date(), updatedAt: new Date() }))
        ),
        status: 'ACTIVE',
        items: {
          create: items,
        },
      },
      include: { items: true },
    });

    return cart as CartWithItems;
  }

  async updateCart(id: string, params: UpdateCartParams): Promise<CartWithItems> {
    const existingCart = await this.getCartById(id);

    const updateData: any = {};

    if (params.status) {
      updateData.status = params.status;
    }

    if (params.customerName !== undefined) {
      updateData.customerName = params.customerName;
    }

    if (params.items) {
      updateData.totalValue = calculateCartTotal(
        params.items.map((item) => ({ ...item, id: '', cartId: '', createdAt: new Date(), updatedAt: new Date() }))
      );
      updateData.itemCount = calculateCartItemCount(
        params.items.map((item) => ({ ...item, id: '', cartId: '', createdAt: new Date(), updatedAt: new Date() }))
      );

      await prisma.cartItem.deleteMany({ where: { cartId: id } });
      updateData.items = { create: params.items };
    }

    const cart = await prisma.cart.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    return cart as CartWithItems;
  }

  async markAsAbandoned(id: string): Promise<CartWithItems> {
    return this.updateCart(id, { status: 'ABANDONED' });
  }

  async markAsRecovered(id: string): Promise<CartWithItems> {
    return this.updateCart(id, { status: 'RECOVERED' });
  }

  async deleteCart(id: string): Promise<void> {
    await this.getCartById(id);

    await prisma.cartItem.deleteMany({ where: { cartId: id } });
    await prisma.cart.delete({ where: { id } });
  }

  async checkAndUpdateExpiredCarts(): Promise<number> {
    const activeCarts = await prisma.cart.findMany({
      where: { status: 'ACTIVE' },
      include: { items: true },
    });

    let updatedCount = 0;

    for (const cart of activeCarts) {
      if (isCartExpired(cart as Cart)) {
        await this.markAsAbandoned(cart.id);
        updatedCount++;
      }
    }

    return updatedCount;
  }
}

export const cartService = new CartService();
