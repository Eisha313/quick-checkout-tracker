'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHeaderCell } from './ui/Table';
import { AbandonedCart, CartStatus } from '@/types';
import { formatCurrency, formatRelativeDate } from '@/lib/date-utils';
import { usePaymentLink } from '@/hooks';
import { CART_STATUS_LABELS, CART_STATUS_COLORS } from '@/lib/constants';

interface CartTableProps {
  carts: AbandonedCart[];
  onCartRecovered?: (cartId: string) => void;
  isLoading?: boolean;
}

type SortField = 'createdAt' | 'cartValue' | 'status' | 'customerEmail';
type SortDirection = 'asc' | 'desc';

export function CartTable({ carts, onCartRecovered, isLoading = false }: CartTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { generateLink, isGenerating, generatingCartId } = usePaymentLink();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCarts = useMemo(() => {
    return [...carts].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'cartValue':
          comparison = a.cartValue - b.cartValue;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'customerEmail':
          comparison = a.customerEmail.localeCompare(b.customerEmail);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [carts, sortField, sortDirection]);

  const handleGenerateLink = async (cartId: string) => {
    const paymentUrl = await generateLink(cartId);
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-gray-400">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHeaderCell 
      className="cursor-pointer hover:bg-gray-100 select-none transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIndicator(field)}
      </div>
    </TableHeaderCell>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-sm">Loading abandoned carts...</p>
        </div>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <svg 
            className="w-16 h-16 mb-4 text-gray-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No abandoned carts</h3>
          <p className="text-sm">Great news! There are no abandoned carts to recover.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="customerEmail">Customer</SortableHeader>
            <SortableHeader field="cartValue">Cart Value</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <SortableHeader field="createdAt">Abandoned</SortableHeader>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCarts.map((cart) => (
            <TableRow key={cart.id} className="hover:bg-gray-50 transition-colors">
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900">{cart.customerEmail}</p>
                  {cart.customerName && (
                    <p className="text-sm text-gray-500">{cart.customerName}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(cart.cartValue)}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  ({cart.items.length} items)
                </span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CART_STATUS_COLORS[cart.status]}`}
                >
                  {CART_STATUS_LABELS[cart.status]}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-600">
                  {formatRelativeDate(cart.createdAt)}
                </span>
              </TableCell>
              <TableCell>
                {cart.status === 'ABANDONED' && (
                  <button
                    onClick={() => handleGenerateLink(cart.id)}
                    disabled={isGenerating && generatingCartId === cart.id}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating && generatingCartId === cart.id ? (
                      <>
                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                        Generating...
                      </>
                    ) : (
                      'Send Recovery Link'
                    )}
                  </button>
                )}
                {cart.status === 'RECOVERED' && (
                  <span className="text-green-600 text-sm font-medium">✓ Recovered</span>
                )}
                {cart.status === 'EXPIRED' && (
                  <span className="text-gray-400 text-sm">Link expired</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
        Showing {sortedCarts.length} cart{sortedCarts.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
