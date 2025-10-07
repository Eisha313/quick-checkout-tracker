import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import {
  getAnalyticsDashboard,
  getAnalyticsSummary,
  getDailyMetrics,
  getTopAbandonedProducts,
  getRevenueByStatus,
  TimeRange,
} from '@/services/analytics.service';
import { ValidationError } from '@/lib/errors';

const validTimeRanges: TimeRange[] = ['7d', '30d', '90d', '12m'];

function validateTimeRange(value: string | null): TimeRange {
  if (!value) return '30d';
  if (!validTimeRanges.includes(value as TimeRange)) {
    throw new ValidationError(`Invalid time range. Must be one of: ${validTimeRanges.join(', ')}`);
  }
  return value as TimeRange;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = validateTimeRange(searchParams.get('timeRange'));
    const view = searchParams.get('view') || 'dashboard';

    let data;

    switch (view) {
      case 'summary':
        data = await getAnalyticsSummary(timeRange);
        break;
      case 'daily':
        data = await getDailyMetrics(timeRange);
        break;
      case 'products':
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        data = await getTopAbandonedProducts(timeRange, limit);
        break;
      case 'revenue':
        data = await getRevenueByStatus(timeRange);
        break;
      case 'dashboard':
      default:
        data = await getAnalyticsDashboard(timeRange);
        break;
    }

    return successResponse(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return errorResponse(error.message, 400);
    }
    console.error('Analytics error:', error);
    return errorResponse('Failed to fetch analytics', 500);
  }
}
