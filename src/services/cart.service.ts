import prisma from '@/lib/prisma';
import { CartWithItems, CartStatus, CreateCartInput, UpdateCartInput } from '@/types';
import { calculateCartTotal } from '@/lib/cart-utils';
import { AppError } from '@/lib/errors';

export class CartService {
  static async getAllCarts(status?: CartStatus): Promise<CartWithItems[]> {
    try {
      const where = status ? { status } : {};
      
      const carts = await prisma.cart.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: {
          abandonedAt: 'desc',
        },
      });

      return carts.map(cart => ({
        ...cart,
        customerName: cart.customerName ?? undefined,
        customerEmail: cart.customerEmail ?? 'unknown@example.com',
        items: cart.items ?? [],
      })) as CartWithItems[];
    } catch (error) {
      console.error('Error fetching carts:', error);
      throw new AppError('Failed to fetch carts', 500);
    }
  }

  static async getCartById(id: string): Promise<CartWithItems | null> {
    if (!id) {
      throw new AppError('Cart ID is required', 400);
    }

    try {
      const cart = await prisma.cart.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!cart) {
        return null;
      }

      return {
        ...cart,
        customerName: cart.customerName ?? undefined,
        customerEmail: cart.customerEmail ?? 'unknown@example.com',
        items: cart.items ?? [],
      } as CartWithItems;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new AppError('Failed to fetch cart', 500);
    }
  }

  static async createCart(data: CreateCartInput): Promise<CartWithItems> {
    if (!data) {
      throw new AppError('Cart data is required', 400);
    }

    try {
      const totalValue = calculateCartTotal(data.items ?? []);
      const customerEmail = data.customerEmail?.trim() || 'unknown@example.com';
      const customerName = data.customerName?.trim() || null;

      const cart = await prisma.cart.create({
        data: {
          customerEmail,
          customerName,
          status: CartStatus.ABANDONED,
          totalValue,
          abandonedAt: new Date(),
          items: {
            create: (data.items ?? []).map((item) => ({
              productId: item.productId || 'unknown',
              productName: item.productName || 'Unknown Product',
              quantity: item.quantity ?? 1,
              price: item.price ?? 0,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        ...cart,
        customerName: cart.customerName ?? undefined,
        customerEmail: cart.customerEmail ?? 'unknown@example.com',
        items: cart.items ?? [],
      } as CartWithItems;
    } catch (error) {
      console.error('Error creating cart:', error);
      throw new AppError('Failed to create cart', 500);
    }
  }

  static async updateCart(id: string, data: UpdateCartInput): Promise<CartWithItems> {
    if (!id) {
      throw new AppError('Cart ID is required', 400);
    }

    try {
      const existingCart = await this.getCartById(id);
      if (!existingCart) {
        throw new AppError('Cart not found', 404);
      }

      const updateData: Record<string, unknown> = {};
      
      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === CartStatus.RECOVERED) {
          updateData.recoveredAt = new Date();
        }
      }
      
      if (data.customerEmail !== undefined) {
        updateData.customerEmail = data.customerEmail?.trim() || existingCart.customerEmail;
      }
      
      if (data.customerName !== undefined) {
        updateData.customerName = data.customerName?.trim() || null;
      }
      
      if (data.paymentLinkId !== undefined) {
        updateData.paymentLinkId = data.paymentLinkId;
      }
      
      if (data.paymentLinkUrl !== undefined) {
        updateData.paymentLinkUrl = data.paymentLinkUrl;
      }

      const cart = await prisma.cart.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
        },
      });

      return {
        ...cart,
        customerName: cart.customerName ?? undefined,
        customerEmail: cart.customerEmail ?? 'unknown@example.com',
        items: cart.items ?? [],
      } as CartWithItems;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error updating cart:', error);
      throw new AppError('Failed to update cart', 500);
    }
  }

  static async deleteCart(id: string): Promise<void> {
    if (!id) {
      throw new AppError('Cart ID is required', 400);
    }

    try {
      const existingCart = await this.getCartById(id);
      if (!existingCart) {
        throw new AppError('Cart not found', 404);
      }

      await prisma.cartItem.deleteMany({
        where: { cartId: id },
      });

      await prisma.cart.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error deleting cart:', error);
      throw new AppError('Failed to delete cart', 500);
    }
  }

  static async getAbandonedCarts(): Promise<CartWithItems[]> {
    return this.getAllCarts(CartStatus.ABANDONED);
  }

  static async getRecoverableCarts(): Promise<CartWithItems[]> {
    try {
      const carts = await prisma.cart.findMany({
        where: {
          status: {
            in: [CartStatus.ABANDONED, CartStatus.PENDING_RECOVERY],
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          totalValue: 'desc',
        },
      });

      return carts.map(cart => ({
        ...cart,
        customerName: cart.customerName ?? undefined,
        customerEmail: cart.customerEmail ?? 'unknown@example.com',
        items: cart.items ?? [],
      })) as CartWithItems[];
    } catch (error) {
      console.error('Error fetching recoverable carts:', error);
      throw new AppError('Failed to fetch recoverable carts', 500);
    }
  }
}