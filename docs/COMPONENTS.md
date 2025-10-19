# Component Documentation

This guide covers the React components used in Quick Checkout Tracker.

## UI Components

### Table

A flexible table component for displaying data.

**Location**: `src/components/ui/Table.tsx`

**Props**:

```typescript
interface TableProps<T> {
  data: T[];                           // Array of data items
  columns: Column<T>[];                // Column definitions
  loading?: boolean;                   // Show loading state
  emptyMessage?: string;               // Message when no data
  onRowClick?: (item: T) => void;      // Row click handler
}

interface Column<T> {
  key: string;                         // Unique column key
  header: string;                      // Column header text
  render?: (item: T) => React.ReactNode; // Custom render function
  className?: string;                  // Additional CSS classes
}
```

**Usage**:

```tsx
import { Table } from '@/components/ui/Table';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  {
    key: 'status',
    header: 'Status',
    render: (item) => <StatusBadge status={item.status} />
  }
];

<Table
  data={carts}
  columns={columns}
  loading={isLoading}
  emptyMessage="No carts found"
/>
```

## Feature Components

### CartTable

Displays abandoned carts with actions.

**Location**: `src/components/CartTable.tsx`

**Props**:

```typescript
interface CartTableProps {
  carts: Cart[];                       // Array of carts
  loading?: boolean;                   // Loading state
  onSendRecoveryLink: (cartId: string) => void;
  onViewDetails: (cartId: string) => void;
}
```

**Features**:
- Displays customer info, cart value, status
- Action buttons for recovery
- Status badges with colors
- Responsive design

**Usage**:

```tsx
import { CartTable } from '@/components';

function Dashboard() {
  const { carts, loading } = useCarts();
  const { generateLink } = usePaymentLink();

  return (
    <CartTable
      carts={carts}
      loading={loading}
      onSendRecoveryLink={generateLink}
      onViewDetails={(id) => router.push(`/carts/${id}`)}
    />
  );
}
```

## Hooks

### useCarts

Manages cart data fetching and mutations.

```typescript
const {
  carts,      // Cart[]
  loading,    // boolean
  error,      // Error | null
  refetch,    // () => Promise<void>
  createCart, // (data: CreateCartData) => Promise<Cart>
  updateCart, // (id: string, data: UpdateCartData) => Promise<Cart>
  deleteCart, // (id: string) => Promise<void>
} = useCarts(options?);
```

### usePaymentLink

Handles payment link generation.

```typescript
const {
  generateLink, // (cartId: string) => Promise<string>
  loading,      // boolean
  error,        // Error | null
} = usePaymentLink();
```

### useAnalytics

Fetches analytics data.

```typescript
const {
  data,     // AnalyticsData | null
  loading,  // boolean
  error,    // Error | null
  refetch,  // () => Promise<void>
} = useAnalytics(options?);
```

## Best Practices

### Component Organization

1. **Single Responsibility**: Each component does one thing well
2. **Composition**: Build complex UIs from simple components
3. **Props Interface**: Always define TypeScript interfaces

### State Management

```tsx
// ✅ Good - Use hooks for data fetching
function CartList() {
  const { carts, loading } = useCarts();
  return <CartTable carts={carts} loading={loading} />;
}

// ❌ Avoid - Fetching in components directly
function CartList() {
  const [carts, setCarts] = useState([]);
  useEffect(() => {
    fetch('/api/carts').then(...);
  }, []);
}
```

### Error Handling

```tsx
function Dashboard() {
  const { data, error, loading } = useAnalytics();

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  return <AnalyticsDisplay data={data} />;
}
```

### Styling

Use Tailwind CSS utilities:

```tsx
// Component with Tailwind classes
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Send Recovery Link
</button>
```

## Adding New Components

1. Create component file in appropriate directory
2. Define TypeScript interface for props
3. Export from `src/components/index.ts`
4. Add documentation to this file

```tsx
// src/components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  children: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}
```
