'use client';

import { useCallback } from 'react';
import { useQuery } from './useQueryClient';
import type { AnalyticsData, DateRange } from '@/types';

interface UseAnalyticsOptions {
  dateRange?: DateRange;
  enabled?: boolean;
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const { dateRange, enabled = true } = options;

  const buildQueryString = useCallback(() => {
    if (!dateRange) return '';
    const params = new URLSearchParams();
    params.set('startDate', dateRange.startDate.toISOString());
    params.set('endDate', dateRange.endDate.toISOString());
    return params.toString();
  }, [dateRange]);

  const queryString = buildQueryString();
  const queryKey = ['analytics', queryString];

  const fetchAnalytics = useCallback(async (): Promise<AnalyticsData> => {
    const url = queryString ? `/api/analytics?${queryString}` : '/api/analytics';
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch analytics');
    }
    const result = await response.json();
    return result.data;
  }, [queryString]);

  const query = useQuery<AnalyticsData>(queryKey, fetchAnalytics, {
    enabled,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes auto-refresh
  });

  return {
    analytics: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useRecoveryTrends(days: number = 30) {
  const fetchTrends = useCallback(async () => {
    const response = await fetch(`/api/analytics/trends?days=${days}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch trends');
    }
    const result = await response.json();
    return result.data;
  }, [days]);

  const query = useQuery<{ date: string; recovered: number; abandoned: number }[]>(
    ['analytics', 'trends', days.toString()],
    fetchTrends,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    trends: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
