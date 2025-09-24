/**
 * Analytics utility functions for recovery tracking
 */

import { CartStatus } from './constants';
import { calculateCartTotal, Cart } from './cart-utils';
import { getDateRange, daysBetween } from './date-utils';

export interface AnalyticsSummary {
  totalAbandonedCarts: number;
  totalRecoveredCarts: number;
  recoveryRate: number;
  totalAbandonedValue: number;
  totalRecoveredValue: number;
  averageCartValue: number;
  periodDays: number;
}

export interface DailyStats {
  date: string;
  abandoned: number;
  recovered: number;
  abandonedValue: number;
  recoveredValue: number;
}

export function calculateRecoveryRate(recovered: number, total: number): number {
  if (typeof recovered !== 'number' || typeof total !== 'number') {
    return 0;
  }
  
  if (total <= 0 || recovered < 0) {
    return 0;
  }
  
  // Ensure recovered doesn't exceed total
  const safeRecovered = Math.min(recovered, total);
  return Math.round((safeRecovered / total) * 100 * 100) / 100;
}

export function calculateAnalyticsSummary(
  carts: Cart[],
  period: 'today' | 'week' | 'month' | 'year' = 'week'
): AnalyticsSummary {
  if (!Array.isArray(carts)) {
    return {
      totalAbandonedCarts: 0,
      totalRecoveredCarts: 0,
      recoveryRate: 0,
      totalAbandonedValue: 0,
      totalRecoveredValue: 0,
      averageCartValue: 0,
      periodDays: 0,
    };
  }

  const { start, end } = getDateRange(period);
  
  const filteredCarts = carts.filter(cart => {
    if (!cart.createdAt) return false;
    const cartDate = new Date(cart.createdAt);
    return !isNaN(cartDate.getTime()) && cartDate >= start && cartDate <= end;
  });

  const abandonedCarts = filteredCarts.filter(
    cart => cart.status === CartStatus.ABANDONED || cart.status === CartStatus.RECOVERED
  );
  
  const recoveredCarts = filteredCarts.filter(
    cart => cart.status === CartStatus.RECOVERED
  );

  const totalAbandonedValue = abandonedCarts.reduce(
    (sum, cart) => sum + calculateCartTotal(cart.items ?? []),
    0
  );

  const totalRecoveredValue = recoveredCarts.reduce(
    (sum, cart) => sum + calculateCartTotal(cart.items ?? []),
    0
  );

  const totalCarts = abandonedCarts.length;
  const averageCartValue = totalCarts > 0 ? totalAbandonedValue / totalCarts : 0;

  return {
    totalAbandonedCarts: abandonedCarts.length,
    totalRecoveredCarts: recoveredCarts.length,
    recoveryRate: calculateRecoveryRate(recoveredCarts.length, abandonedCarts.length),
    totalAbandonedValue: Math.round(totalAbandonedValue * 100) / 100,
    totalRecoveredValue: Math.round(totalRecoveredValue * 100) / 100,
    averageCartValue: Math.round(averageCartValue * 100) / 100,
    periodDays: daysBetween(start, end),
  };
}

export function generateDailyStats(carts: Cart[], days: number = 7): DailyStats[] {
  if (!Array.isArray(carts) || typeof days !== 'number' || days <= 0) {
    return [];
  }
  
  const stats: DailyStats[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayCarts = carts.filter(cart => {
      if (!cart.createdAt) return false;
      const cartDate = new Date(cart.createdAt);
      if (isNaN(cartDate.getTime())) return false;
      return cartDate.toISOString().split('T')[0] === dateStr;
    });

    const abandoned = dayCarts.filter(
      cart => cart.status === CartStatus.ABANDONED || cart.status === CartStatus.RECOVERED
    );
    const recovered = dayCarts.filter(cart => cart.status === CartStatus.RECOVERED);

    stats.push({
      date: dateStr,
      abandoned: abandoned.length,
      recovered: recovered.length,
      abandonedValue: Math.round(
        abandoned.reduce((sum, cart) => sum + calculateCartTotal(cart.items ?? []), 0) * 100
      ) / 100,
      recoveredValue: Math.round(
        recovered.reduce((sum, cart) => sum + calculateCartTotal(cart.items ?? []), 0) * 100
      ) / 100,
    });
  }

  return stats;
}

export function formatPercentage(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.max(0, amount));
}
