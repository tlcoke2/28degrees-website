import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider = ({ children }: StripeProviderProps) => {
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key is not set. Please check your environment variables.');
    return <div>Payment processing is currently unavailable. Please try again later.</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
