/**
 * Cart utility functions
 */

import { CartStatus, CART_ABANDONMENT_THRESHOLD_HOURS, RECOVERY_LINK_EXPIRY_HOURS } from './constants';
import { isWithinHours, parseDate } from './date-utils';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName?: string;
  items: CartItem[];
  status: CartStatus;
  createdAt: Date;
  updatedAt: Date;
  recoveryLinkId?: string;
  recoveryLinkCreatedAt?: Date;
}

export function calculateCartTotal(items: CartItem[]): number {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  
  return items.reduce((total, item) => {
    const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
    const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    return total + (price * Math.max(0, quantity));
  }, 0);
}

export function formatCartTotal(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.max(0, amount));
}

export function isCartAbandoned(cart: Cart): boolean {
  if (cart.status !== CartStatus.ACTIVE) {
    return false;
  }
  
  const updatedAt = cart.updatedAt instanceof Date ? cart.updatedAt : parseDate(cart.updatedAt as unknown as string);
  if (!updatedAt) {
    return false;
  }
  
  return !isWithinHours(updatedAt, CART_ABANDONMENT_THRESHOLD_HOURS);
}

export function isRecoveryLinkValid(cart: Cart): boolean {
  if (!cart.recoveryLinkId || !cart.recoveryLinkCreatedAt) {
    return false;
  }
  
  const linkCreatedAt = cart.recoveryLinkCreatedAt instanceof Date 
    ? cart.recoveryLinkCreatedAt 
    : parseDate(cart.recoveryLinkCreatedAt as unknown as string);
    
  if (!linkCreatedAt) {
    return false;
  }
  
  return isWithinHours(linkCreatedAt, RECOVERY_LINK_EXPIRY_HOURS);
}

export function getCartSummary(cart: Cart): string {
  const itemCount = cart.items?.length ?? 0;
  const total = calculateCartTotal(cart.items ?? []);
  return `${itemCount} item${itemCount === 1 ? '' : 's'} - ${formatCartTotal(total)}`;
}

export function sortCartsByValue(carts: Cart[], order: 'asc' | 'desc' = 'desc'): Cart[] {
  if (!Array.isArray(carts)) {
    return [];
  }
  
  return [...carts].sort((a, b) => {
    const totalA = calculateCartTotal(a.items ?? []);
    const totalB = calculateCartTotal(b.items ?? []);
    return order === 'desc' ? totalB - totalA : totalA - totalB;
  });
}

export function filterAbandonedCarts(carts: Cart[]): Cart[] {
  if (!Array.isArray(carts)) {
    return [];
  }
  
  return carts.filter(isCartAbandoned);
}

export function getHighValueCarts(carts: Cart[], threshold: number = 100): Cart[] {
  if (!Array.isArray(carts) || typeof threshold !== 'number') {
    return [];
  }
  
  return carts.filter(cart => calculateCartTotal(cart.items ?? []) >= threshold);
}
