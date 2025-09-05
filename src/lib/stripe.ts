import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export interface CartItem {
  name: string;
  quantity: number;
  priceInCents: number;
}

export interface CreatePaymentLinkParams {
  cartId: string;
  customerEmail: string;
  items: CartItem[];
  expiresInHours?: number;
}

export async function createRecoveryPaymentLink({
  cartId,
  customerEmail,
  items,
  expiresInHours = 72,
}: CreatePaymentLinkParams): Promise<string> {
  const lineItems: Stripe.PaymentLinkCreateParams.LineItem[] = await Promise.all(
    items.map(async (item) => {
      const product = await stripe.products.create({
        name: item.name,
        metadata: {
          cartId,
          source: 'cart_recovery',
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: item.priceInCents,
        currency: 'usd',
      });

      return {
        price: price.id,
        quantity: item.quantity,
      };
    })
  );

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60;

  const paymentLink = await stripe.paymentLinks.create({
    line_items: lineItems,
    metadata: {
      cartId,
      customerEmail,
      type: 'cart_recovery',
    },
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/recovery/success?cart_id=${cartId}`,
      },
    },
  });

  return paymentLink.url;
}

export async function getPaymentLinkStatus(paymentLinkId: string) {
  const paymentLink = await stripe.paymentLinks.retrieve(paymentLinkId);
  return {
    active: paymentLink.active,
    url: paymentLink.url,
    metadata: paymentLink.metadata,
  };
}

export async function deactivatePaymentLink(paymentLinkId: string) {
  await stripe.paymentLinks.update(paymentLinkId, {
    active: false,
  });
}
