# Quick Checkout Tracker - Setup Guide

This guide will walk you through setting up the Quick Checkout Tracker application from scratch.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or use a cloud provider like Supabase, Neon, etc.)
- Stripe account with API keys
- npm or yarn package manager

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/quick-checkout-tracker.git
cd quick-checkout-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/checkout_tracker"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
API_KEY="your-secure-api-key"
```

### 4. Database Setup

Generate the Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 5. Stripe Configuration

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys from Developers > API keys
3. Set up webhooks at Developers > Webhooks:
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy the webhook signing secret to your `.env`

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Docker

```bash
# Build image
docker build -t checkout-tracker .

# Run container
docker run -p 3000:3000 --env-file .env checkout-tracker
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Configuration Options

### Cart Abandonment Settings

Configure in `src/lib/constants.ts`:

```typescript
// Time before cart is considered abandoned (in hours)
export const CART_ABANDONMENT_THRESHOLD = 1;

// Payment link expiration (in days)
export const PAYMENT_LINK_EXPIRY_DAYS = 7;
```

### Pagination Defaults

```typescript
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

### Stripe Webhook Errors

- Verify webhook secret is correct
- Ensure endpoint URL is publicly accessible
- Check Stripe dashboard for webhook logs

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Support

For issues and feature requests, please open an issue on GitHub.
