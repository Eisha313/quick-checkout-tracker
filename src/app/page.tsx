'use client';

import React, { Suspense } from 'react';
import { useCarts } from '@/hooks/useCarts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { CartTable } from '@/components/CartTable';
import { LoadingOverlay, PageLoader } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/date-utils';

function StatsCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {trend && (
            <div
              className={`ml-4 flex items-center text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { carts, isLoading: cartsLoading, error: cartsError, refetch } = useCarts();
  const { analytics, isLoading: analyticsLoading, error: analyticsError } = useAnalytics();

  if (cartsLoading || analyticsLoading) {
    return <LoadingOverlay message="Loading dashboard data..." />;
  }

  if (cartsError || analyticsError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load dashboard data</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const abandonedCarts = carts?.filter((c) => c.status === 'ABANDONED') || [];
  const recoveryRate = analytics?.recoveryRate || 0;
  const totalRevenue = analytics?.totalRecoveredRevenue || 0;
  const totalAbandoned = analytics?.totalAbandonedValue || 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Abandoned Carts"
          value={abandonedCarts.length}
          subtitle="Active recovery targets"
        />
        <StatsCard
          title="Recovery Rate"
          value={`${recoveryRate.toFixed(1)}%`}
          subtitle="Last 30 days"
          trend={{ value: 2.5, isPositive: true }}
        />
        <StatsCard
          title="Recovered Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Total recovered"
        />
        <StatsCard
          title="Abandoned Value"
          value={formatCurrency(totalAbandoned)}
          subtitle="Potential recovery"
        />
      </div>

      {/* Cart Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Abandoned Carts
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Click on any cart to generate a recovery payment link
          </p>
        </div>
        <CartTable carts={abandonedCarts} onCartUpdate={refetch} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recovery Timeline
          </h3>
        </div>
        <div className="p-4">
          {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
            <div className="space-y-3">
              {analytics.dailyStats.slice(0, 7).map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-600">
                    {formatDate(new Date(day.date))}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {day.abandonedCount} abandoned
                    </span>
                    <span className="text-sm text-green-600">
                      {day.recoveredCount} recovered
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(day.recoveredRevenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No recovery data available yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Quick Checkout Tracker
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Recover abandoned carts with one-click payment links
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 mr-2 bg-green-400 rounded-full animate-pulse"></span>
                Connected to Stripe
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<PageLoader />}>
          <DashboardContent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Quick Checkout Tracker • Abandoned Cart Recovery System
          </p>
        </div>
      </footer>
    </div>
  );
}
