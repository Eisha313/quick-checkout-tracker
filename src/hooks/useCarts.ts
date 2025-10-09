import { useState, useEffect, useCallback } from 'react';
import { AbandonedCart, CartStatus, PaginatedResponse } from '@/types';

interface UseCartsOptions {
  status?: CartStatus;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseCartsReturn {
  carts: AbandonedCart[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchCarts: () => Promise<void>;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setStatus: (status: CartStatus | undefined) => void;
  updateCartLocally: (id: string, updates: Partial<AbandonedCart>) => void;
  removeCartLocally: (id: string) => void;
}

export function useCarts(options: UseCartsOptions = {}): UseCartsReturn {
  const { autoFetch = true } = options;
  
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<CartStatus | undefined>(options.status);
  const [page, setPage] = useState(options.page || 1);
  const [limit] = useState(options.limit || 10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchCarts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/carts?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch carts');
      }

      const result = data.data as PaginatedResponse<AbandonedCart>;
      setCarts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status]);

  const refetch = useCallback(async () => {
    await fetchCarts();
  }, [fetchCarts]);

  const updateCartLocally = useCallback((id: string, updates: Partial<AbandonedCart>) => {
    setCarts((prev) =>
      prev.map((cart) =>
        cart.id === id ? { ...cart, ...updates } : cart
      )
    );
  }, []);

  const removeCartLocally = useCallback((id: string) => {
    setCarts((prev) => prev.filter((cart) => cart.id !== id));
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCarts();
    }
  }, [autoFetch, fetchCarts]);

  return {
    carts,
    loading,
    error,
    pagination,
    fetchCarts,
    refetch,
    setPage,
    setStatus,
    updateCartLocally,
    removeCartLocally,
  };
}

export function useCart(id: string) {
  const [cart, setCart] = useState<AbandonedCart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/carts/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch cart');
      }

      setCart(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateCart = useCallback(async (updates: Partial<AbandonedCart>) => {
    if (!id) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/carts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update cart');
      }

      setCart(data.data);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const deleteCart = useCallback(async () => {
    if (!id) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/carts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to delete cart');
      }

      setCart(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    cart,
    loading,
    error,
    fetchCart,
    updateCart,
    deleteCart,
  };
}
