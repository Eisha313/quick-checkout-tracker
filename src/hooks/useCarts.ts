'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, invalidateQueries } from './useQueryClient';
import type { AbandonedCart, CartStatus } from '@/types';

interface CartsResponse {
  data: AbandonedCart[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseCartsOptions {
  page?: number;
  limit?: number;
  status?: CartStatus;
  sortBy?: 'createdAt' | 'cartValue' | 'customerEmail';
  sortOrder?: 'asc' | 'desc';
}

interface UpdateCartData {
  status?: CartStatus;
  notes?: string;
}

export function useCarts(options: UseCartsOptions = {}) {
  const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = options;

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    if (status) params.set('status', status);
    return params.toString();
  }, [page, limit, status, sortBy, sortOrder]);

  const queryKey = ['carts', buildQueryString()];

  const fetchCarts = useCallback(async (): Promise<CartsResponse> => {
    const response = await fetch(`/api/carts?${buildQueryString()}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch carts');
    }
    return response.json();
  }, [buildQueryString]);

  const query = useQuery<CartsResponse>(queryKey, fetchCarts, {
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    carts: query.data?.data ?? [],
    pagination: query.data?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCart(id: string | null) {
  const fetchCart = useCallback(async (): Promise<AbandonedCart> => {
    if (!id) throw new Error('Cart ID is required');
    const response = await fetch(`/api/carts/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch cart');
    }
    const result = await response.json();
    return result.data;
  }, [id]);

  return useQuery<AbandonedCart>(['cart', id ?? 'null'], fetchCart, {
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useUpdateCart() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const mutation = useMutation<AbandonedCart, { id: string; data: UpdateCartData }>(
    async ({ id, data }) => {
      setUpdatingId(id);
      const response = await fetch(`/api/carts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cart');
      }
      const result = await response.json();
      return result.data;
    },
    {
      onSuccess: () => {
        invalidateQueries('carts');
      },
      onSettled: () => {
        setUpdatingId(null);
      },
    }
  );

  return {
    updateCart: mutation.mutate,
    updateCartAsync: mutation.mutateAsync,
    isUpdating: mutation.isLoading,
    updatingId,
    error: mutation.error,
  };
}

export function useDeleteCart() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mutation = useMutation<void, string>(
    async (id) => {
      setDeletingId(id);
      const response = await fetch(`/api/carts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete cart');
      }
    },
    {
      onSuccess: () => {
        invalidateQueries('carts');
      },
      onSettled: () => {
        setDeletingId(null);
      },
    }
  );

  return {
    deleteCart: mutation.mutate,
    deleteCartAsync: mutation.mutateAsync,
    isDeleting: mutation.isLoading,
    deletingId,
    error: mutation.error,
  };
}
