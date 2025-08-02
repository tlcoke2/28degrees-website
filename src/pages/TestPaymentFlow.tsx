import React, { useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper } from '@mui/material';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '../components/Payment/PaymentForm';
import { stripePromise } from '../config/stripe';

const TestPaymentFlow: React.FC = () => {
  const [amount, setAmount] = useState<number>(100); // Default to $1.00
  const [description, setDescription] = useState<string>('Test Payment');
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment successful!', { paymentIntentId });
    alert(`Payment successful! Payment Intent ID: ${paymentIntentId}`);
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment error: ${error}`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Test Payment Flow
      </Typography>
      
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Test Payment Settings
        </Typography>
        
        <Box component="form" sx={{ mb: 3 }}>
          <TextField
            label="Amount (in cents)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            fullWidth
            margin="normal"
            helperText="Enter amount in cents (e.g., 100 = $1.00)"
          />
          
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            margin="normal"
          />
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowPaymentForm(true)}
            sx={{ mt: 2 }}
          >
            Test Payment
          </Button>
        </Box>
        
        {showPaymentForm && (
          <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Test Payment Form
            </Typography>
            
            <Elements stripe={stripePromise}>
              <PaymentForm
                amount={amount / 100} // Convert cents to dollars
                description={description}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
            
            <Button
              variant="outlined"
              onClick={() => setShowPaymentForm(false)}
              sx={{ mt: 2 }}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 4, backgroundColor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Test Card Numbers
        </Typography>
        <Typography variant="body2" paragraph>
          Use these test card numbers in the payment form:
        </Typography>
        <Box component="ul" sx={{ pl: 3, '& li': { fontFamily: 'monospace', mb: 1 } }}>
          <li>Visa: 4242 4242 4242 4242</li>
          <li>Mastercard: 5555 5555 5555 4444</li>
          <li>Amex: 3782 822463 10005</li>
          <li>Discover: 6011 1111 1111 1117</li>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Use any future date for expiry, any 3+ digits for CVC, and any postal code.
        </Typography>
      </Paper>
    </Container>
  );
};

export default TestPaymentFlow;
