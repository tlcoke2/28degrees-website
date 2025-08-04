import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from './PaymentForm';
import { Box, CircularProgress, Typography } from '@mui/material';
// Removed unused import
import { useState, useEffect } from 'react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

type StripePaymentWrapperProps = {
  amount: number;
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
};

export const StripePaymentWrapper = ({
  amount,
  currency = 'usd',
  description,
  metadata = {},
  onSuccess,
  onError,
}: StripePaymentWrapperProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      const errorMsg = 'Stripe publishable key is not configured';
      console.error(errorMsg);
      setError(errorMsg);
      onError?.(errorMsg);
    }
    setLoading(false);
  }, [onError]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">
          Payment processing is currently unavailable. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        amount={amount}
        currency={currency}
        description={description}
        metadata={metadata}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

export default StripePaymentWrapper;
