import { prisma } from '@/lib/prisma';
import {
  calculateRecoveryRate,
  calculateAverageCartValue,
  calculateTotalRevenue,
  groupCartsByTimeRange,
  generateRecoveryTrend,
} from '@/lib/analytics';
import { CartStatus } from '@/types';
import { startOfDay, endOfDay, subDays, subMonths } from '@/lib/date-utils';

export interface AnalyticsSummary {
  totalCarts: number;
  abandonedCarts: number;
  recoveredCarts: number;
  expiredCarts: number;
  pendingCarts: number;
  recoveryRate: number;
  totalRecoveredRevenue: number;
  totalPotentialRevenue: number;
  averageCartValue: number;
  averageRecoveredCartValue: number;
}

export interface DailyMetric {
  date: string;
  abandoned: number;
  recovered: number;
  revenue: number;
  recoveryRate: number;
}

export interface AnalyticsDashboard {
  summary: AnalyticsSummary;
  dailyMetrics: DailyMetric[];
  topAbandonedProducts: { productId: string; productName: string; count: number }[];
  recoveryTrend: { period: string; rate: number }[];
}

export type TimeRange = '7d' | '30d' | '90d' | '12m';

function getDateRangeFromTimeRange(timeRange: TimeRange): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  let start: Date;

  switch (timeRange) {
    case '7d':
      start = startOfDay(subDays(new Date(), 7));
      break;
    case '30d':
      start = startOfDay(subDays(new Date(), 30));
      break;
    case '90d':
      start = startOfDay(subDays(new Date(), 90));
      break;
    case '12m':
      start = startOfDay(subMonths(new Date(), 12));
      break;
    default:
      start = startOfDay(subDays(new Date(), 30));
  }

  return { start, end };
}

export async function getAnalyticsSummary(timeRange: TimeRange = '30d'): Promise<AnalyticsSummary> {
  const { start, end } = getDateRangeFromTimeRange(timeRange);

  const carts = await prisma.cart.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      items: true,
    },
  });

  const abandonedCarts = carts.filter((c) => c.status === CartStatus.ABANDONED);
  const recoveredCarts = carts.filter((c) => c.status === CartStatus.RECOVERED);
  const expiredCarts = carts.filter((c) => c.status === CartStatus.EXPIRED);
  const pendingCarts = carts.filter((c) => c.status === CartStatus.PENDING);

  const recoveredValues = recoveredCarts.map((c) => c.totalValue.toNumber());
  const allValues = carts.map((c) => c.totalValue.toNumber());
  const abandonedValues = abandonedCarts.map((c) => c.totalValue.toNumber());

  return {
    totalCarts: carts.length,
    abandonedCarts: abandonedCarts.length,
    recoveredCarts: recoveredCarts.length,
    expiredCarts: expiredCarts.length,
    pendingCarts: pendingCarts.length,
    recoveryRate: calculateRecoveryRate(recoveredCarts.length, abandonedCarts.length + recoveredCarts.length),
    totalRecoveredRevenue: calculateTotalRevenue(recoveredValues),
    totalPotentialRevenue: calculateTotalRevenue(abandonedValues),
    averageCartValue: calculateAverageCartValue(allValues),
    averageRecoveredCartValue: calculateAverageCartValue(recoveredValues),
  };
}

export async function getDailyMetrics(timeRange: TimeRange = '30d'): Promise<DailyMetric[]> {
  const { start, end } = getDateRangeFromTimeRange(timeRange);

  const carts = await prisma.cart.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  const groupedCarts = groupCartsByTimeRange(
    carts.map((c) => ({
      ...c,
      totalValue: c.totalValue.toNumber(),
    })),
    timeRange === '12m' ? 'month' : 'day'
  );

  return Object.entries(groupedCarts).map(([date, dayCarts]) => {
    const abandoned = dayCarts.filter((c) => c.status === CartStatus.ABANDONED).length;
    const recovered = dayCarts.filter((c) => c.status === CartStatus.RECOVERED);
    const recoveredCount = recovered.length;
    const revenue = recovered.reduce((sum, c) => sum + c.totalValue, 0);

    return {
      date,
      abandoned,
      recovered: recoveredCount,
      revenue,
      recoveryRate: calculateRecoveryRate(recoveredCount, abandoned + recoveredCount),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTopAbandonedProducts(
  timeRange: TimeRange = '30d',
  limit: number = 10
): Promise<{ productId: string; productName: string; count: number }[]> {
  const { start, end } = getDateRangeFromTimeRange(timeRange);

  const cartItems = await prisma.cartItem.findMany({
    where: {
      cart: {
        status: CartStatus.ABANDONED,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    },
    select: {
      productId: true,
      productName: true,
    },
  });

  const productCounts = cartItems.reduce((acc, item) => {
    const key = item.productId;
    if (!acc[key]) {
      acc[key] = { productId: item.productId, productName: item.productName, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { productId: string; productName: string; count: number }>);

  return Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getRecoveryTrend(
  timeRange: TimeRange = '30d'
): Promise<{ period: string; rate: number }[]> {
  const dailyMetrics = await getDailyMetrics(timeRange);
  
  return generateRecoveryTrend(
    dailyMetrics.map((m) => ({
      date: m.date,
      recovered: m.recovered,
      total: m.abandoned + m.recovered,
    }))
  );
}

export async function getAnalyticsDashboard(timeRange: TimeRange = '30d'): Promise<AnalyticsDashboard> {
  const [summary, dailyMetrics, topAbandonedProducts, recoveryTrend] = await Promise.all([
    getAnalyticsSummary(timeRange),
    getDailyMetrics(timeRange),
    getTopAbandonedProducts(timeRange),
    getRecoveryTrend(timeRange),
  ]);

  return {
    summary,
    dailyMetrics,
    topAbandonedProducts,
    recoveryTrend,
  };
}

export async function getRevenueByStatus(timeRange: TimeRange = '30d'): Promise<{
  recovered: number;
  potential: number;
  expired: number;
}> {
  const { start, end } = getDateRangeFromTimeRange(timeRange);

  const carts = await prisma.cart.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      status: true,
      totalValue: true,
    },
  });

  const result = {
    recovered: 0,
    potential: 0,
    expired: 0,
  };

  for (const cart of carts) {
    const value = cart.totalValue.toNumber();
    switch (cart.status) {
      case CartStatus.RECOVERED:
        result.recovered += value;
        break;
      case CartStatus.ABANDONED:
        result.potential += value;
        break;
      case CartStatus.EXPIRED:
        result.expired += value;
        break;
    }
  }

  return result;
}
