import { Cart, CartItem, CartStatus, CartWithItems } from '@/types';
import { formatCurrency, formatPercentage } from './constants';

export function calculateCartTotal(items: CartItem[]): number {
  if (!items || !Array.isArray(items)) {
    return 0;
  }
  return items.reduce((total, item) => {
    const quantity = item?.quantity ?? 0;
    const price = item?.price ?? 0;
    return total + quantity * price;
  }, 0);
}

export function calculateCartItemCount(items: CartItem[]): number {
  if (!items || !Array.isArray(items)) {
    return 0;
  }
  return items.reduce((count, item) => count + (item?.quantity ?? 0), 0);
}

export function formatCartValue(value: number): string {
  return formatCurrency(value ?? 0);
}

export function isCartAbandoned(cart: Cart): boolean {
  if (!cart) return false;
  return cart.status === CartStatus.ABANDONED;
}

export function isCartRecoverable(cart: Cart): boolean {
  if (!cart) return false;
  return (
    cart.status === CartStatus.ABANDONED ||
    cart.status === CartStatus.PENDING_RECOVERY
  );
}

export function getCartAge(cart: Cart): number {
  if (!cart?.abandonedAt) return 0;
  const abandonedDate = new Date(cart.abandonedAt);
  const now = new Date();
  return Math.floor((now.getTime() - abandonedDate.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCartAgeLabel(cart: Cart): string {
  const days = getCartAge(cart);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export function sortCartsByValue(carts: CartWithItems[], descending = true): CartWithItems[] {
  if (!carts || !Array.isArray(carts)) {
    return [];
  }
  return [...carts].sort((a, b) => {
    const valueA = a?.totalValue ?? 0;
    const valueB = b?.totalValue ?? 0;
    return descending ? valueB - valueA : valueA - valueB;
  });
}

export function sortCartsByDate(carts: CartWithItems[], descending = true): CartWithItems[] {
  if (!carts || !Array.isArray(carts)) {
    return [];
  }
  return [...carts].sort((a, b) => {
    const dateA = a?.abandonedAt ? new Date(a.abandonedAt).getTime() : 0;
    const dateB = b?.abandonedAt ? new Date(b.abandonedAt).getTime() : 0;
    return descending ? dateB - dateA : dateA - dateB;
  });
}

export function filterCartsByStatus(carts: CartWithItems[], status: CartStatus): CartWithItems[] {
  if (!carts || !Array.isArray(carts)) {
    return [];
  }
  return carts.filter((cart) => cart?.status === status);
}

export function calculateRecoveryRate(totalCarts: number, recoveredCarts: number): string {
  if (!totalCarts || totalCarts === 0) return '0%';
  return formatPercentage((recoveredCarts ?? 0) / totalCarts);
}

export function getCustomerDisplayName(cart: Cart | CartWithItems | null | undefined): string {
  if (!cart) return 'Unknown Customer';
  
  const email = cart.customerEmail;
  const name = cart.customerName;
  
  if (name && name.trim()) {
    return name.trim();
  }
  
  if (email && email.trim()) {
    return email.trim();
  }
  
  return 'Unknown Customer';
}

export function getCustomerInitials(cart: Cart | CartWithItems | null | undefined): string {
  const displayName = getCustomerDisplayName(cart);
  
  if (displayName === 'Unknown Customer') {
    return '?';
  }
  
  const parts = displayName.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return displayName.substring(0, 2).toUpperCase();
}

export function safeCartAccess<T>(cart: Cart | CartWithItems | null | undefined, accessor: (c: Cart | CartWithItems) => T, defaultValue: T): T {
  if (!cart) return defaultValue;
  try {
    const result = accessor(cart);
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  }
}