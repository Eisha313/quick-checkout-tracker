import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quick Checkout Tracker',
  description: 'Track and recover abandoned shopping carts with Stripe payment links',
  keywords: ['ecommerce', 'abandoned cart', 'recovery', 'stripe', 'payments'],
  authors: [{ name: 'Quick Checkout Tracker Team' }],
  openGraph: {
    title: 'Quick Checkout Tracker',
    description: 'Track and recover abandoned shopping carts with Stripe payment links',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  );
}
