import { useState, useCallback } from 'react';
import { GeneratedPaymentLink, PaymentLinkOptions } from '@/services/payment-link.service';

interface UsePaymentLinkReturn {
  generateLink: (cartId: string, options?: PaymentLinkOptions) => Promise<GeneratedPaymentLink>;
  deactivateLink: (cartId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function usePaymentLink(): UsePaymentLinkReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLink = useCallback(
    async (cartId: string, options?: PaymentLinkOptions): Promise<GeneratedPaymentLink> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/carts/${cartId}/payment-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: options ? JSON.stringify(options) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate payment link');
        }

        return data.data as GeneratedPaymentLink;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deactivateLink = useCallback(async (cartId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/carts/${cartId}/payment-link`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate payment link');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateLink,
    deactivateLink,
    isLoading,
    error,
    clearError,
  };
}
