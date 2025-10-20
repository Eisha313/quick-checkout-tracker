import { BaseService, PaginatedResult } from './base.service';
import { Cart, CartStatus } from '@prisma/client';
import { CartWithItems } from '@/types';
import { validateEmail, validateCartItems, validatePositiveNumber } from '@/lib/validation';
import { ValidationError } from '@/lib/errors';

export interface CreateCartInput {
  customerEmail: string;
  customerName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdateCartInput {
  status?: CartStatus;
  customerName?: string;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface CartFilters {
  status?: CartStatus;
  minValue?: number;
  maxValue?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class CartServiceImpl extends BaseService {
  async getCarts(filters: CartFilters = {}): Promise<PaginatedResult<CartWithItems>> {
    try {
      const { status, minValue, maxValue, page = 1, limit = 10, sortBy, sortOrder } = filters;
      const { skip, take } = this.buildPaginationParams(page, limit);
      const orderBy = this.buildOrderByParams(sortBy, sortOrder);

      const where: Record<string, unknown> = {};
      
      if (status) {
        where.status = status;
      }
      
      if (minValue !== undefined || maxValue !== undefined) {
        where.totalValue = {};
        if (minValue !== undefined) {
          (where.totalValue as Record<string, number>).gte = minValue;
        }
        if (maxValue !== undefined) {
          (where.totalValue as Record<string, number>).lte = maxValue;
        }
      }

      const [carts, total] = await Promise.all([
        this.prisma.cart.findMany({
          where,
          include: { items: true },
          skip,
          take,
          orderBy,
        }),
        this.prisma.cart.count({ where }),
      ]);

      return {
        data: carts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.handleDatabaseError(error, 'fetch carts');
    }
  }

  async getCartById(id: string): Promise<CartWithItems> {
    try {
      return await this.ensureExists(
        this.prisma.cart.findUnique({
          where: { id },
          include: { items: true },
        }),
        'Cart',
        id
      );
    } catch (error) {
      this.handleDatabaseError(error, 'fetch cart');
    }
  }

  async createCart(input: CreateCartInput): Promise<CartWithItems> {
    try {
      this.validateCreateInput(input);

      const totalValue = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      const cart = await this.prisma.cart.create({
        data: {
          customerEmail: input.customerEmail,
          customerName: input.customerName,
          totalValue,
          status: 'ABANDONED',
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        include: { items: true },
      });

      return cart;
    } catch (error) {
      this.handleDatabaseError(error, 'create cart');
    }
  }

  async updateCart(id: string, input: UpdateCartInput): Promise<CartWithItems> {
    try {
      await this.getCartById(id);
      this.validateUpdateInput(input);

      const updateData: Record<string, unknown> = {};

      if (input.status) {
        updateData.status = input.status;
      }

      if (input.customerName !== undefined) {
        updateData.customerName = input.customerName;
      }

      if (input.items) {
        const totalValue = input.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0
        );
        updateData.totalValue = totalValue;

        await this.prisma.cartItem.deleteMany({ where: { cartId: id } });
        
        await this.prisma.cartItem.createMany({
          data: input.items.map((item) => ({
            cartId: id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        });
      }

      const cart = await this.prisma.cart.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });

      return cart;
    } catch (error) {
      this.handleDatabaseError(error, 'update cart');
    }
  }

  async deleteCart(id: string): Promise<void> {
    try {
      await this.getCartById(id);
      
      await this.prisma.cart.delete({ where: { id } });
    } catch (error) {
      this.handleDatabaseError(error, 'delete cart');
    }
  }

  async getAbandonedCarts(): Promise<CartWithItems[]> {
    try {
      return await this.prisma.cart.findMany({
        where: { status: 'ABANDONED' },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.handleDatabaseError(error, 'fetch abandoned carts');
    }
  }

  private validateCreateInput(input: CreateCartInput): void {
    if (!validateEmail(input.customerEmail)) {
      throw new ValidationError('Invalid email address');
    }

    if (!validateCartItems(input.items)) {
      throw new ValidationError('Invalid cart items');
    }
  }

  private validateUpdateInput(input: UpdateCartInput): void {
    if (input.items && !validateCartItems(input.items)) {
      throw new ValidationError('Invalid cart items');
    }
  }
}

export const cartService = new CartServiceImpl();
