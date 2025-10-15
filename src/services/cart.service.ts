import { prisma } from '@/lib/prisma';
import { CartStatus, CartWithItems, CreateCartInput, UpdateCartInput } from '@/types';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { isValidEmail, isValidCartStatus } from '@/lib/validation';

export class CartService {
  static async findAll(options?: {
    status?: CartStatus;
    limit?: number;
    offset?: number;
  }): Promise<CartWithItems[]> {
    const { status, limit = 50, offset = 0 } = options || {};

    const where = status ? { status } : {};

    const carts = await prisma.cart.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        abandonedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return carts as CartWithItems[];
  }

  static async findById(id: string): Promise<CartWithItems> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Invalid cart ID');
    }

    const cart = await prisma.cart.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!cart) {
      throw new NotFoundError(`Cart with ID ${id} not found`);
    }

    return cart as CartWithItems;
  }

  static async findAbandoned(): Promise<CartWithItems[]> {
    const carts = await prisma.cart.findMany({
      where: {
        status: 'ABANDONED',
      },
      include: {
        items: true,
      },
      orderBy: {
        abandonedAt: 'desc',
      },
    });

    return carts as CartWithItems[];
  }

  static async create(data: CreateCartInput): Promise<CartWithItems> {
    if (!data.customerEmail || !isValidEmail(data.customerEmail)) {
      throw new ValidationError('Valid customer email is required');
    }

    if (!data.customerName || data.customerName.trim().length === 0) {
      throw new ValidationError('Customer name is required');
    }

    if (!data.items || data.items.length === 0) {
      throw new ValidationError('Cart must have at least one item');
    }

    const totalValue = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const cart = await prisma.cart.create({
      data: {
        customerEmail: data.customerEmail.toLowerCase().trim(),
        customerName: data.customerName.trim(),
        totalValue,
        currency: data.currency || 'USD',
        status: 'ABANDONED',
        abandonedAt: new Date(),
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.imageUrl,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return cart as CartWithItems;
  }

  static async update(
    id: string,
    data: UpdateCartInput
  ): Promise<CartWithItems> {
    // Verify cart exists first
    await this.findById(id);

    // Validate status if provided
    if (data.status && !isValidCartStatus(data.status)) {
      throw new ValidationError(`Invalid cart status: ${data.status}`);
    }

    // Validate email if provided
    if (data.customerEmail && !isValidEmail(data.customerEmail)) {
      throw new ValidationError('Invalid email format');
    }

    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;
      
      // Set recoveredAt timestamp when status changes to RECOVERED
      if (data.status === 'RECOVERED') {
        updateData.recoveredAt = new Date();
      }
    }

    if (data.customerEmail) {
      updateData.customerEmail = data.customerEmail.toLowerCase().trim();
    }

    if (data.customerName) {
      updateData.customerName = data.customerName.trim();
    }

    if (data.paymentLinkId) {
      updateData.paymentLinkId = data.paymentLinkId;
    }

    if (data.paymentLinkUrl) {
      updateData.paymentLinkUrl = data.paymentLinkUrl;
    }

    const cart = await prisma.cart.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    return cart as CartWithItems;
  }

  static async updateStatus(
    id: string,
    status: CartStatus
  ): Promise<CartWithItems> {
    return this.update(id, { status });
  }

  static async markAsRecovered(id: string): Promise<CartWithItems> {
    return this.update(id, { status: 'RECOVERED' });
  }

  static async delete(id: string): Promise<void> {
    // Verify cart exists first
    await this.findById(id);

    // Delete items first due to relation
    await prisma.cartItem.deleteMany({
      where: { cartId: id },
    });

    await prisma.cart.delete({
      where: { id },
    });
  }

  static async count(status?: CartStatus): Promise<number> {
    const where = status ? { status } : {};
    return prisma.cart.count({ where });
  }
}
