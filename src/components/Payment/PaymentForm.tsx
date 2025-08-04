import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';
import { Box, Button, Typography, CircularProgress, Alert, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/UserContext';

type User = {
  uid: string;
  email: string | null;
  getIdToken: () => Promise<string>;
};

// Define types for our payment form
type PaymentFormProps = {
  amount: number;
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
};

// Card element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

// Main payment form component
export const PaymentForm = ({
  amount,
  currency = 'usd',
  description,
  metadata = {},
  onSuccess,
  onError,
}: PaymentFormProps) => {
  const { user } = useAuth() as { user: User | null };
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { enqueueSnackbar } = useSnackbar();

  // Get or create a payment intent when the component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const token = await user?.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/payments/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify({
            amount,
            currency,
            description,
            metadata: {
              ...metadata,
              userId: user?.uid || 'guest',
              userEmail: user?.email || 'guest@example.com',
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMessage);
        onError?.(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, currency, description, metadata, user, onError]);

  // Handle card input changes
  const handleChange = (event: StripeCardElementChangeEvent) => {
    setDisabled(event.empty);
    setError(event.error ? event.error.message || 'Invalid card details' : null);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Stripe has not been properly initialized');
      setProcessing(false);
      return;
    }

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Get the customer email from user context or empty string
      const customerEmail = user?.email || '';
      
      // Confirm the card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Guest Customer',
            email: customerEmail,
          },
        },
        receipt_email: customerEmail || undefined,
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        
        // Show success message
        enqueueSnackbar('Payment successful!', { variant: 'success' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  // Render the payment form
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h2" gutterBottom>
          Payment Details
        </Typography>
        
        <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleChange}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          disabled={!stripe || processing || disabled}
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          startIcon={processing ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
        </Button>

        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Your payment is secure and encrypted.
        </Typography>
      </Stack>
    </Box>
  );
};

export default PaymentForm;
