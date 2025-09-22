import { AbandonedCart, CartStatus, PaymentLink } from '@/types';

export interface AnalyticsSummary {
  totalCarts: number;
  abandonedCarts: number;
  recoveredCarts: number;
  pendingCarts: number;
  recoveryRate: number;
  totalAbandonedValue: number;
  totalRecoveredValue: number;
  averageCartValue: number;
  potentialRecoveryValue: number;
}

export interface DailyAnalytics {
  date: string;
  abandoned: number;
  recovered: number;
  abandonedValue: number;
  recoveredValue: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export function calculateAnalyticsSummary(carts: AbandonedCart[]): AnalyticsSummary {
  const totalCarts = carts.length;
  const abandonedCarts = carts.filter(c => c.status === 'abandoned').length;
  const recoveredCarts = carts.filter(c => c.status === 'recovered').length;
  const pendingCarts = carts.filter(c => c.status === 'pending').length;

  const recoveryRate = totalCarts > 0 
    ? Math.round((recoveredCarts / totalCarts) * 100 * 100) / 100
    : 0;

  const totalAbandonedValue = carts
    .filter(c => c.status === 'abandoned')
    .reduce((sum, c) => sum + c.cartValue, 0);

  const totalRecoveredValue = carts
    .filter(c => c.status === 'recovered')
    .reduce((sum, c) => sum + c.cartValue, 0);

  const averageCartValue = totalCarts > 0
    ? Math.round((carts.reduce((sum, c) => sum + c.cartValue, 0) / totalCarts) * 100) / 100
    : 0;

  const potentialRecoveryValue = carts
    .filter(c => c.status === 'abandoned' || c.status === 'pending')
    .reduce((sum, c) => sum + c.cartValue, 0);

  return {
    totalCarts,
    abandonedCarts,
    recoveredCarts,
    pendingCarts,
    recoveryRate,
    totalAbandonedValue,
    totalRecoveredValue,
    averageCartValue,
    potentialRecoveryValue,
  };
}

export function calculateDailyAnalytics(
  carts: AbandonedCart[],
  range: TimeRange
): DailyAnalytics[] {
  const dailyMap = new Map<string, DailyAnalytics>();
  
  // Initialize all days in range
  const current = new Date(range.start);
  while (current <= range.end) {
    const dateKey = current.toISOString().split('T')[0];
    dailyMap.set(dateKey, {
      date: dateKey,
      abandoned: 0,
      recovered: 0,
      abandonedValue: 0,
      recoveredValue: 0,
    });
    current.setDate(current.getDate() + 1);
  }

  // Aggregate cart data
  for (const cart of carts) {
    const dateKey = new Date(cart.createdAt).toISOString().split('T')[0];
    const daily = dailyMap.get(dateKey);
    
    if (daily) {
      if (cart.status === 'abandoned') {
        daily.abandoned += 1;
        daily.abandonedValue += cart.cartValue;
      } else if (cart.status === 'recovered') {
        daily.recovered += 1;
        daily.recoveredValue += cart.cartValue;
      }
    }
  }

  return Array.from(dailyMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getTimeRange(period: 'week' | 'month' | 'quarter'): TimeRange {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setDate(end.getDate() - 30);
      break;
    case 'quarter':
      start.setDate(end.getDate() - 90);
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function calculateRecoveryTrend(
  currentPeriod: DailyAnalytics[],
  previousPeriod: DailyAnalytics[]
): { trend: 'up' | 'down' | 'stable'; percentage: number } {
  const currentRecovered = currentPeriod.reduce((sum, d) => sum + d.recovered, 0);
  const currentTotal = currentPeriod.reduce((sum, d) => sum + d.abandoned + d.recovered, 0);
  const currentRate = currentTotal > 0 ? currentRecovered / currentTotal : 0;

  const previousRecovered = previousPeriod.reduce((sum, d) => sum + d.recovered, 0);
  const previousTotal = previousPeriod.reduce((sum, d) => sum + d.abandoned + d.recovered, 0);
  const previousRate = previousTotal > 0 ? previousRecovered / previousTotal : 0;

  const difference = currentRate - previousRate;
  const percentage = Math.abs(Math.round(difference * 100 * 100) / 100);

  if (Math.abs(difference) < 0.01) {
    return { trend: 'stable', percentage: 0 };
  }

  return {
    trend: difference > 0 ? 'up' : 'down',
    percentage,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
