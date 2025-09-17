import type { CartItem, CartStatus, RecoveryStats } from '@/types';

/**
 * Calculate total value of cart items
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * Format currency value for display
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // Assuming amounts are stored in cents
}

/**
 * Calculate time since cart was abandoned
 */
export function getAbandonmentAge(abandonedAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - abandonedAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
}

/**
 * Check if cart is eligible for recovery (not expired, not already recovered)
 */
export function isRecoverable(status: CartStatus, abandonedAt: Date, maxAgeDays = 30): boolean {
  if (status === 'RECOVERED' || status === 'EXPIRED') {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - abandonedAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays <= maxAgeDays;
}

/**
 * Calculate recovery statistics
 */
export function calculateRecoveryStats(
  totalCarts: number,
  recoveredCarts: number,
  totalValue: number,
  recoveredValue: number
): RecoveryStats {
  return {
    totalCarts,
    recoveredCarts,
    recoveryRate: totalCarts > 0 ? (recoveredCarts / totalCarts) * 100 : 0,
    totalValue,
    recoveredValue,
    averageCartValue: totalCarts > 0 ? totalValue / totalCarts : 0,
  };
}

/**
 * Get status badge color for UI
 */
export function getStatusColor(status: CartStatus): string {
  const colors: Record<CartStatus, string> = {
    ABANDONED: 'bg-yellow-100 text-yellow-800',
    RECOVERED: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    LINK_SENT: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Validate cart items structure
 */
export function validateCartItems(items: unknown): items is CartItem[] {
  if (!Array.isArray(items)) return false;
  
  return items.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      typeof item.quantity === 'number' &&
      item.price >= 0 &&
      item.quantity > 0
  );
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}
