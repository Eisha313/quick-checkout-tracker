'use client';

import React from 'react';
import { Table } from './ui/Table';
import { formatCurrency, formatRelativeTime } from '@/lib/date-utils';
import { getCartStatusColor, getCartStatusLabel } from '@/lib/cart-utils';
import { AbandonedCart, CartStatus } from '@/types';
import { usePaymentLink } from '@/hooks';

interface CartTableProps {
  carts: AbandonedCart[];
  isLoading?: boolean;
  onCartSelect?: (cart: AbandonedCart) => void;
}

function StatusBadge({ status }: { status: CartStatus }) {
  const colorClass = getCartStatusColor(status);
  const label = getCartStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}

function PaymentLinkButton({ cart }: { cart: AbandonedCart }) {
  const { generateLink, isGenerating } = usePaymentLink();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await generateLink(cart.id);
  };

  if (cart.status === 'recovered') {
    return (
      <span className="text-green-600 text-sm font-medium">
        Recovered
      </span>
    );
  }

  if (cart.paymentLink) {
    return (
      <a
        href={cart.paymentLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline"
      >
        View Link
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isGenerating ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating...
        </>
      ) : (
        'Generate Link'
      )}
    </button>
  );
}

export function CartTable({ carts, isLoading, onCartSelect }: CartTableProps) {
  const columns = [
    {
      key: 'customer',
      header: 'Customer',
      render: (cart: AbandonedCart) => (
        <div>
          <div className="font-medium text-gray-900">
            {cart.customerName || 'Unknown'}
          </div>
          <div className="text-gray-500">{cart.customerEmail}</div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (cart: AbandonedCart) => (
        <span className="text-gray-900">
          {cart.items.length} item{cart.items.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Cart Value',
      render: (cart: AbandonedCart) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(cart.totalAmount, cart.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (cart: AbandonedCart) => <StatusBadge status={cart.status} />,
    },
    {
      key: 'abandonedAt',
      header: 'Abandoned',
      render: (cart: AbandonedCart) => (
        <span className="text-gray-500">
          {formatRelativeTime(cart.abandonedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Recovery',
      render: (cart: AbandonedCart) => <PaymentLinkButton cart={cart} />,
    },
  ];

  return (
    <Table
      columns={columns}
      data={carts}
      keyExtractor={(cart) => cart.id}
      isLoading={isLoading}
      emptyMessage="No abandoned carts found"
      onRowClick={onCartSelect}
    />
  );
}
