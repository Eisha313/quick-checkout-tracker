# Deployment Guide

This guide covers deploying Quick Checkout Tracker to production.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- Vercel account (recommended) or other hosting

## Deployment Options

### Vercel (Recommended)

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**

   In Vercel dashboard, add:
   
   ```
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   ```

3. **Set Up Database**

   ```bash
   # Run migrations
   npx prisma migrate deploy
   ```

### Docker

1. **Create Dockerfile**

   ```dockerfile
   FROM node:18-alpine AS base
   
   FROM base AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Build and Run**

   ```bash
   docker build -t checkout-tracker .
   docker run -p 3000:3000 --env-file .env checkout-tracker
   ```

### Manual Deployment

1. **Build Application**

   ```bash
   npm run build
   ```

2. **Start Production Server**

   ```bash
   npm start
   ```

## Database Setup

### PostgreSQL on Railway

1. Create new project on Railway
2. Add PostgreSQL plugin
3. Copy connection string to `DATABASE_URL`

### PostgreSQL on Supabase

1. Create new Supabase project
2. Go to Settings > Database
3. Copy connection string (use connection pooler for serverless)

### Running Migrations

```bash
# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy
```

## Stripe Configuration

### Production Setup

1. **Get API Keys**
   - Go to Stripe Dashboard > Developers > API Keys
   - Copy the live secret key

2. **Configure Webhook**
   - Go to Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
   - Copy webhook signing secret

3. **Test Webhook**
   ```bash
   stripe trigger checkout.session.completed
   ```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://example.com` |

## Monitoring

### Health Check

Access `/api/health` to verify the application is running.

### Logging

The application logs:
- API requests and responses
- Database queries (in development)
- Stripe webhook events
- Errors with stack traces

### Recommended Tools

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and monitoring
- **LogTail**: Log aggregation and search

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure cookie options
- [ ] Enable rate limiting
- [ ] Use live Stripe keys (not test)
- [ ] Verify webhook signatures
- [ ] Keep dependencies updated
- [ ] Enable database SSL

## Scaling Considerations

### Database

- Use connection pooling (PgBouncer)
- Add read replicas for heavy loads
- Index frequently queried columns

### Application

- Vercel auto-scales serverless functions
- Use caching for analytics data
- Implement pagination for large datasets

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check for SSL requirement
# Add ?sslmode=require to DATABASE_URL
```

### Stripe Webhook Failures

1. Verify webhook secret is correct
2. Check endpoint URL is accessible
3. Review Stripe dashboard for failed events

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```
