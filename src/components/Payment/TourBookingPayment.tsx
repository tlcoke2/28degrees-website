import React, { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useElements } from '@stripe/react-stripe-js';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { stripePromise } from '../../config/stripe';

interface TourBookingPaymentProps {
  tourId: string;
  tourName: string;
  price: number;
  numberOfPeople: number;
  date: string;
  specialRequests?: string;
}

const TourBookingPayment: React.FC<TourBookingPaymentProps> = ({
  tourId,
  tourName,
  price,
  numberOfPeople,
  date,
  specialRequests,
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsProcessing(true);

    try {
      const stripe = await stripePromise;
      
      // TODO: Replace with actual backend endpoint
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tourId,
          tourName,
          price,
          numberOfPeople,
          date,
          specialRequests,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        throw result.error;
      }

      setSuccessMessage('Payment successful! Your booking is confirmed.');
      navigate('/booking-confirmation');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred during payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Typography variant="h5" component="h3" gutterBottom>
        Payment Details
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Tour: {tourName}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Date: {date}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Total: ${price * numberOfPeople}
        </Typography>

        <CardElement options={{
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
        }} />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={isProcessing}
          sx={{ mt: 3 }}
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </Button>
      </Box>
    </Paper>
  );
};

export default TourBookingPayment;
