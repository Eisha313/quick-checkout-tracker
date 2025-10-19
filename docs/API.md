# Quick Checkout Tracker API Documentation

This document provides detailed information about the REST API endpoints available in the Quick Checkout Tracker application.

## Base URL

All API endpoints are relative to your application's base URL:

```
http://localhost:3000/api
```

## Authentication

Currently, the API uses basic authentication via the `x-api-key` header. Set your API key in the `.env` file:

```env
API_KEY=your-secret-api-key
```

## Endpoints

### Carts

#### List All Carts

```http
GET /api/carts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by cart status: `abandoned`, `recovered`, `expired` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 100) |

**Response:**

```json
{
  "success": true,
  "data": {
    "carts": [
      {
        "id": "cart_123",
        "customerEmail": "customer@example.com",
        "customerName": "John Doe",
        "items": [...],
        "totalValue": 99.99,
        "status": "abandoned",
        "abandonedAt": "2024-01-15T10:30:00Z",
        "paymentLink": null,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

#### Get Single Cart

```http
GET /api/carts/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cart_123",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "items": [
      {
        "name": "Product Name",
        "quantity": 2,
        "price": 49.99
      }
    ],
    "totalValue": 99.98,
    "status": "abandoned",
    "abandonedAt": "2024-01-15T10:30:00Z",
    "paymentLink": null,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Create Cart

```http
POST /api/carts
```

**Request Body:**

```json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "items": [
    {
      "name": "Product Name",
      "quantity": 2,
      "price": 49.99
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cart_123",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "items": [...],
    "totalValue": 99.98,
    "status": "abandoned",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### Update Cart

```http
PATCH /api/carts/:id
```

**Request Body:**

```json
{
  "status": "recovered"
}
```

#### Delete Cart

```http
DELETE /api/carts/:id
```

### Payment Links

#### Generate Payment Link

```http
POST /api/carts/:id/payment-link
```

Generates a Stripe payment link for the specified cart.

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentLink": "https://checkout.stripe.com/pay/cs_test_...",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

### Analytics

#### Get Analytics Data

```http
GET /api/analytics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Start date (ISO 8601 format) |
| `endDate` | string | End date (ISO 8601 format) |
| `period` | string | Preset period: `7d`, `30d`, `90d` |

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAbandoned": 150,
      "totalRecovered": 45,
      "recoveryRate": 30.0,
      "totalAbandonedValue": 15000.00,
      "totalRecoveredValue": 4500.00
    },
    "dailyStats": [
      {
        "date": "2024-01-15",
        "abandoned": 10,
        "recovered": 3,
        "abandonedValue": 1000.00,
        "recoveredValue": 300.00
      }
    ]
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Cart not found"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting

The API is rate limited to 100 requests per minute per IP address. When rate limited, you'll receive a `429 Too Many Requests` response.

## Webhooks

Stripe webhooks are handled at:

```
POST /api/webhooks/stripe
```

Configure your Stripe dashboard to send the following events:
- `checkout.session.completed`
- `payment_intent.succeeded`
