import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Divider, Button } from '@mui/material';
import { PaymentForm } from '../components/Payment/PaymentForm';
import { StripeProvider } from '../components/Payment/StripeProvider';
import { useSnackbar } from 'notistack';

interface LocationState {
  amount: number;
  description: string;
  bookingDetails?: {
    tourId: string;
    date: string;
    participants: number;
    // Add other booking details as needed
  };
}

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Default values in case of direct navigation
  const { 
    amount = 0, 
    description = 'Tour Booking',
    bookingDetails 
  } = (location.state as LocationState) || {};

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setIsProcessing(true);
      
      // Here you would typically send the payment intent ID to your backend
      // to confirm the booking and update your database
      const response = await fetch(`${import.meta.env.VITE_API_URL}/confirm-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if needed
          // 'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          paymentIntentId,
          amount,
          bookingDetails,
          // Include any other necessary booking data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm booking');
      }

      // Navigate to success page or show success message
      enqueueSnackbar('Booking confirmed!', { variant: 'success' });
      navigate('/booking-confirmation', { 
        state: { 
          paymentIntentId,
          amount,
          bookingDetails,
        } 
      });
    } catch (error) {
      console.error('Error confirming booking:', error);
      enqueueSnackbar('Error confirming booking. Please contact support.', { variant: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    enqueueSnackbar(error, { variant: 'error' });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Complete Your Booking
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1">
            <strong>Description:</strong> {description}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
            Total: ${amount.toFixed(2)}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Payment Information
        </Typography>
        
        <StripeProvider>
          <PaymentForm
            amount={amount}
            description={description}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </StripeProvider>
      </Paper>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          disabled={isProcessing}
        >
          Back to Booking
        </Button>
      </Box>
    </Box>
  );
};

export default CheckoutPage;
