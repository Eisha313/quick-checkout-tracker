import { useState, useEffect, useCallback } from 'react';
import { TimeRange, AnalyticsDashboard, AnalyticsSummary } from '@/services/analytics.service';

interface UseAnalyticsOptions {
  timeRange?: TimeRange;
  view?: 'dashboard' | 'summary' | 'daily' | 'products' | 'revenue';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAnalyticsReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
}

export function useAnalytics<T = AnalyticsDashboard>(
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn<T> {
  const {
    timeRange: initialTimeRange = '30d',
    view = 'dashboard',
    autoRefresh = false,
    refreshInterval = 60000,
  } = options;

  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        timeRange,
        view,
      });

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, view]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAnalytics]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAnalytics,
    setTimeRange,
  };
}

export function useAnalyticsSummary(timeRange: TimeRange = '30d') {
  return useAnalytics<AnalyticsSummary>({ timeRange, view: 'summary' });
}

export function useRecoveryMetrics(timeRange: TimeRange = '30d') {
  return useAnalytics<{ recovered: number; potential: number; expired: number }>({
    timeRange,
    view: 'revenue',
  });
}
