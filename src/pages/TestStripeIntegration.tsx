import React from 'react';
import { Container, Typography, Paper, Box, Button } from '@mui/material';
import { StripePaymentWrapper } from '../components/Payment/StripePaymentWrapper';
import { useSnackbar } from 'notistack';

const TestStripeIntegration: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [paymentCompleted, setPaymentCompleted] = React.useState(false);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment successful:', paymentIntentId);
    setPaymentCompleted(true);
    enqueueSnackbar('Payment successful!', { variant: 'success' });
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    enqueueSnackbar(`Payment error: ${error}`, { variant: 'error' });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stripe Integration Test
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page tests the Stripe payment integration. A $1.00 test charge will be made.
        </Typography>

        {!paymentCompleted ? (
          <Box mt={4}>
            <StripePaymentWrapper
              amount={1.0}
              description="Test payment"
              metadata={{
                test: 'true',
                userId: 'test-user-123',
              }}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Box>
        ) : (
          <Box mt={4} textAlign="center">
            <Typography variant="h5" color="success.main" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography paragraph>
              Thank you for your test payment. The transaction was processed successfully.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setPaymentCompleted(false)}
            >
              Make Another Test Payment
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TestStripeIntegration;
