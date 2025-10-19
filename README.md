# Quick Checkout Tracker

A simple utility to track and manage abandoned shopping cart recovery with Stripe payment integration.

![Dashboard Preview](docs/images/dashboard-preview.png)

## Features

- 📊 **Dashboard** - View all abandoned carts with customer details and cart values
- 💳 **One-Click Payment Links** - Generate Stripe payment links instantly for cart recovery
- 📈 **Analytics** - Track recovery rates and recovered revenue over time
- 🔔 **Real-time Updates** - Automatic status updates when payments are completed

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/quick-checkout-tracker.git
cd quick-checkout-tracker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation and configuration
- [API Documentation](docs/API.md) - REST API reference

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **State Management**: React hooks with SWR

## Project Structure

```
src/
├── app/                 # Next.js app router pages and API routes
│   ├── api/            # REST API endpoints
│   └── page.tsx        # Main dashboard page
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── *.tsx          # Feature components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and configurations
├── services/          # Business logic services
└── types/             # TypeScript type definitions
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_APP_URL` | Your application URL |
| `API_KEY` | API authentication key |

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/carts` | GET | List all abandoned carts |
| `/api/carts` | POST | Create a new cart |
| `/api/carts/:id` | GET | Get cart details |
| `/api/carts/:id` | PATCH | Update cart status |
| `/api/carts/:id/payment-link` | POST | Generate payment link |
| `/api/analytics` | GET | Get recovery analytics |

See [API Documentation](docs/API.md) for full details.

## Development

```bash
# Run development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format

# Run tests
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For questions and support, please [open an issue](https://github.com/your-org/quick-checkout-tracker/issues).
