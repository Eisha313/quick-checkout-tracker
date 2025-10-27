import { useState, useCallback, useRef, useEffect } from 'react';

export interface QueryState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
}

export interface QueryOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  staleTime?: number;
  cacheTime?: number;
}

export interface MutationState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export interface MutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: Error, variables: V) => void;
  onSettled?: (data: T | null, error: Error | null, variables: V) => void;
}

const queryCache = new Map<string, { data: unknown; timestamp: number }>();

export function useQuery<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options: QueryOptions<T> = {}
): QueryState<T> & { refetch: () => Promise<void> } {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const cacheKey = Array.isArray(key) ? key.join(':') : key;
  const [state, setState] = useState<QueryState<T>>(() => {
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return {
        data: cached.data as T,
        error: null,
        isLoading: false,
        isError: false,
        isSuccess: true,
        isFetching: false,
      };
    }
    return {
      data: null,
      error: null,
      isLoading: true,
      isError: false,
      isSuccess: false,
      isFetching: true,
    };
  });

  const mountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const cached = queryCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < staleTime) {
      setState((prev) => ({
        ...prev,
        data: cached.data as T,
        isLoading: false,
        isSuccess: true,
        isFetching: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isFetching: true }));

    try {
      const data = await queryFn();
      lastFetchRef.current = now;

      queryCache.set(cacheKey, { data, timestamp: now });

      if (mountedRef.current) {
        setState({
          data,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
          isFetching: false,
        });
        onSuccess?.(data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          error,
          isLoading: false,
          isError: true,
          isSuccess: false,
          isFetching: false,
        }));
        onError?.(error);
      }
    }
  }, [cacheKey, enabled, queryFn, onSuccess, onError, staleTime]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  const refetch = useCallback(async () => {
    queryCache.delete(cacheKey);
    await fetchData();
  }, [cacheKey, fetchData]);

  return { ...state, refetch };
}

export function useMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<T>,
  options: MutationOptions<T, V> = {}
): MutationState<T> & {
  mutate: (variables: V) => Promise<T | null>;
  mutateAsync: (variables: V) => Promise<T>;
  reset: () => void;
} {
  const { onSuccess, onError, onSettled } = options;

  const [state, setState] = useState<MutationState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const mutateAsync = useCallback(
    async (variables: V): Promise<T> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
      });

      try {
        const data = await mutationFn(variables);
        setState({
          data,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
        });
        onSuccess?.(data, variables);
        onSettled?.(data, null, variables);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setState({
          data: null,
          error,
          isLoading: false,
          isError: true,
          isSuccess: false,
        });
        onError?.(error, variables);
        onSettled?.(null, error, variables);
        throw error;
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    async (variables: V): Promise<T | null> => {
      try {
        return await mutateAsync(variables);
      } catch {
        return null;
      }
    },
    [mutateAsync]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
    });
  }, []);

  return { ...state, mutate, mutateAsync, reset };
}

export function invalidateQueries(keyOrKeys: string | string[]): void {
  const keysToInvalidate = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
  
  for (const key of queryCache.keys()) {
    for (const invalidateKey of keysToInvalidate) {
      if (key.startsWith(invalidateKey)) {
        queryCache.delete(key);
      }
    }
  }
}

export function clearQueryCache(): void {
  queryCache.clear();
}
