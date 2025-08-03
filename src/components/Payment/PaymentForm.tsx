import { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeCardElementChangeEvent } from '@stripe/stripe-js';
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useSnackbar } from 'notistack';

interface PaymentFormProps {
  amount: number;
  description: string;
  onSuccess: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export const PaymentForm = ({
  amount,
  description,
  onSuccess,
  onError,
}: PaymentFormProps) => {
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    // Create PaymentIntent as soon as the component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            description,
          }),
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    createPaymentIntent();
  }, [amount, description]);

  const handleChange = async (event: StripeCardElementChangeEvent) => {
    // Listen for changes in the CardElement
    // and display any errors as the customer types their card details
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            // Add any additional billing details here
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        setSucceeded(true);
        enqueueSnackbar('Payment successful!', { variant: 'success' });
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      onError?.(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="success.main" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="body1">
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
