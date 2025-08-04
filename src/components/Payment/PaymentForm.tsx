import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeCardElementChangeEvent, StripeCardElement } from '@stripe/stripe-js';
import { Box, Button, Typography, CircularProgress, Alert, TextField, Stack } from '@mui/material';
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
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { enqueueSnackbar } = useSnackbar();

  // Initialize payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/payments/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user?.getIdToken()}`
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            description,
            metadata: {
              ...metadata,
              userId: user?.uid || 'guest',
              userEmail: user?.email || email,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        onError?.(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    if (amount > 0 && !clientSecret) {
      createPaymentIntent();
    }
  }, [amount, currency, description, metadata, user, email, onError]);

  // Handle card input changes
  const handleCardChange = async (event: StripeCardElementChangeEvent) => {
    setDisabled(event.empty);
    setError(event.error ? event.error.message || 'Card details are incomplete' : null);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm the card payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement) as StripeCardElement,
          billing_details: {
            name: name.trim() || 'Guest Customer',
            email: email.trim() || user?.email || '',
          },
        },
        receipt_email: email.trim() || user?.email || undefined,
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
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
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Stack spacing={3}>
        <Typography variant="h5" component="h2" gutterBottom>
          Payment Details
        </Typography>
          Thank you for your payment. Your booking is now confirmed.
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>
      
      <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <CardElement
          options={CARD_OPTIONS}
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
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>

      <Typography variant="caption" color="text.secondary" display="block" mt={2}>
        Your payment is secure and encrypted.
      </Typography>
    </Box>
  );
};

export default PaymentForm;
