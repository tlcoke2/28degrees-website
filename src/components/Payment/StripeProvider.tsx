import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';
import { stripePromise } from '../../config/stripe';

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider = ({ children }: StripeProviderProps) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
