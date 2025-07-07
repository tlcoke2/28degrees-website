import { loadStripe } from '@stripe/stripe-js';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
export const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '');

export const STRIPE_PRICE_IDS = {
  SOUTH_COAST_ADVENTURE: 'price_1234567890',
  WATERFALL_EXPERIENCE: 'price_0987654321',
  CULTURAL_TOUR: 'price_1122334455',
} as const;

export type TourPriceId = keyof typeof STRIPE_PRICE_IDS;
