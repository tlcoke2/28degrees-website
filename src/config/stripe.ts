import { loadStripe } from '@stripe/stripe-js';

// Single source of truth for the Stripe instance
// Use Vite's import.meta.env for environment variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

if (!stripePublishableKey) {
  console.warn('Stripe publishable key is not set. Please check your environment variables.');
}

// Initialize Stripe once and export the promise
export const stripePromise = loadStripe(stripePublishableKey);

// Stripe price IDs for different tours
export const STRIPE_PRICE_IDS = {
  SOUTH_COAST_ADVENTURE: 'price_1234567890',
  WATERFALL_EXPERIENCE: 'price_0987654321',
  CULTURAL_TOUR: 'price_1122334455',
} as const;

export type TourPriceId = keyof typeof STRIPE_PRICE_IDS;
