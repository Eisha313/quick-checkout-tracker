import type { AbandonedCart, PaymentLink, RecoveryEvent } from '@prisma/client';

// Domain types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface CustomerInfo {
  email: string;
  name?: string;
  phone?: string;
}

// Cart status enum matching Prisma schema
export type CartStatus = 'ABANDONED' | 'RECOVERED' | 'EXPIRED' | 'LINK_SENT';

// Extended types with relations
export interface AbandonedCartWithRelations extends AbandonedCart {
  paymentLinks?: PaymentLink[];
  recoveryEvents?: RecoveryEvent[];
}

export interface PaymentLinkWithCart extends PaymentLink {
  cart?: AbandonedCart;
}

// Analytics types
export interface RecoveryStats {
  totalCarts: number;
  recoveredCarts: number;
  recoveryRate: number;
  totalValue: number;
  recoveredValue: number;
  averageCartValue: number;
}

export interface DailyStats {
  date: string;
  abandoned: number;
  recovered: number;
  revenue: number;
}

// API request/response types
export interface CreateCartRequest {
  customerEmail: string;
  customerName?: string;
  items: CartItem[];
  cartValue: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface GeneratePaymentLinkRequest {
  cartId: string;
  expiresInHours?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface CartFilters {
  status?: CartStatus;
  minValue?: number;
  maxValue?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}
