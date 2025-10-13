import { AbandonedCart, CartItem, CartStatus } from '@/types';
import { CART_ABANDONMENT_THRESHOLD_HOURS } from './constants';

export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function isCartAbandoned(lastActivityAt: Date): boolean {
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceActivity >= CART_ABANDONMENT_THRESHOLD_HOURS;
}

export function getCartStatusPriority(status: CartStatus): number {
  const priorities: Record<CartStatus, number> = {
    ABANDONED: 1,
    PENDING_RECOVERY: 2,
    RECOVERED: 3,
    EXPIRED: 4,
  };
  return priorities[status];
}

export function sortCartsByPriority(carts: AbandonedCart[]): AbandonedCart[] {
  return [...carts].sort((a, b) => {
    const priorityDiff = getCartStatusPriority(a.status) - getCartStatusPriority(b.status);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function filterCartsByStatus(
  carts: AbandonedCart[],
  status: CartStatus | 'ALL'
): AbandonedCart[] {
  if (status === 'ALL') return carts;
  return carts.filter((cart) => cart.status === status);
}

export function getHighValueCarts(
  carts: AbandonedCart[],
  threshold: number = 100
): AbandonedCart[] {
  return carts.filter((cart) => cart.cartValue >= threshold);
}

export function formatCartItemsSummary(items: CartItem[]): string {
  if (items.length === 0) return 'No items';
  if (items.length === 1) return items[0].name;
  return `${items[0].name} and ${items.length - 1} more`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
