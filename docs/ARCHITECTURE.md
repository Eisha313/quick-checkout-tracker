# Architecture Overview

This document provides an overview of the Quick Checkout Tracker architecture.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe
- **Styling**: Tailwind CSS

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   └── api/               # API Routes
│       ├── carts/         # Cart CRUD endpoints
│       └── analytics/     # Analytics endpoints
├── components/            # React components
│   └── ui/               # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── services/              # Business logic services
└── types/                 # TypeScript types
```

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Route  │────▶│   Service   │
│  (Hooks)    │◀────│  (Handler)  │◀────│   (Logic)   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │   Prisma    │
                                        │  (Database) │
                                        └─────────────┘
```

## Key Concepts

### Abandoned Carts

Carts are considered "abandoned" when a customer adds items but doesn't complete checkout within a specified timeout period. The system tracks:

- Customer information (email, name)
- Cart contents and total value
- Cart status (abandoned, recovered, expired)
- Recovery attempts

### Cart Status Flow

```
ABANDONED ──▶ LINK_SENT ──▶ RECOVERED
    │                           │
    └───────▶ EXPIRED ◀─────────┘
```

### Payment Link Generation

When recovering a cart, the system:

1. Creates a Stripe Payment Link with cart items
2. Updates cart status to `LINK_SENT`
3. Tracks when links are created
4. Monitors for successful payments

## Services Layer

### CartService

Handles all cart-related operations:
- `getAll()`: Fetch all carts with pagination
- `getById()`: Fetch single cart
- `create()`: Create new cart
- `updateStatus()`: Update cart status
- `delete()`: Remove cart

### PaymentLinkService

Manages Stripe payment link creation:
- `createPaymentLink()`: Generate recovery link
- Handles price creation for cart items
- Returns shareable payment URL

### AnalyticsService

Provides analytics and metrics:
- `getOverview()`: Summary statistics
- Recovery rates calculation
- Revenue tracking

## API Design

All API routes follow RESTful conventions:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/carts | List all carts |
| POST | /api/carts | Create cart |
| GET | /api/carts/:id | Get single cart |
| PATCH | /api/carts/:id | Update cart |
| DELETE | /api/carts/:id | Delete cart |
| POST | /api/carts/:id/payment-link | Generate payment link |
| GET | /api/analytics | Get analytics |

## Error Handling

The application uses standardized error handling:

1. **ValidationError**: Invalid input data
2. **NotFoundError**: Resource not found
3. **StripeError**: Payment processing errors

All errors return consistent JSON responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message"
  }
}
```

## Environment Configuration

See `.env.example` for required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Webhook verification
- `NEXT_PUBLIC_APP_URL`: Application URL

## Security Considerations

1. **API Authentication**: Middleware validates requests
2. **Input Validation**: All inputs validated with Zod
3. **SQL Injection**: Prevented by Prisma ORM
4. **Environment Variables**: Sensitive data in env vars
5. **Stripe Webhooks**: Verified with signatures
