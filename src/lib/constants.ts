// Cart configuration
export const CART_CONFIG = {
  DEFAULT_EXPIRY_DAYS: 30,
  PAYMENT_LINK_EXPIRY_HOURS: 72,
  MIN_CART_VALUE: 100, // in cents ($1.00)
  MAX_ITEMS_PER_CART: 100,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// Status labels for UI
export const STATUS_LABELS = {
  ABANDONED: 'Abandoned',
  RECOVERED: 'Recovered',
  EXPIRED: 'Expired',
  LINK_SENT: 'Link Sent',
} as const;

// API routes
export const API_ROUTES = {
  CARTS: '/api/carts',
  CART_BY_ID: (id: string) => `/api/carts/${id}`,
  PAYMENT_LINKS: '/api/payment-links',
  ANALYTICS: '/api/analytics',
  WEBHOOK: '/api/webhook/stripe',
} as const;

// Dashboard routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CARTS: '/dashboard/carts',
  ANALYTICS: '/dashboard/analytics',
  SETTINGS: '/dashboard/settings',
} as const;

// Stripe configuration
export const STRIPE_CONFIG = {
  CURRENCY: 'usd',
  PAYMENT_METHOD_TYPES: ['card'] as const,
  SUCCESS_URL_PARAM: 'success',
  CANCEL_URL_PARAM: 'canceled',
} as const;

// Time constants (in milliseconds)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;
