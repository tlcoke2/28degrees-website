import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Divider, Container } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSnackbar } from 'notistack';

interface LocationState {
  paymentIntentId: string;
  amount: number;
  bookingDetails: {
    tourId?: string;
    tourName?: string;
    date?: string;
    participants?: number;
    // Add other booking details as needed
  };
}

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  // Default values in case of direct navigation
  const { 
    paymentIntentId = 'N/A',
    amount = 0,
    bookingDetails = {}
  } = (location.state as LocationState) || {};

  const handleViewBookings = () => {
    navigate('/my-bookings');
  };

  const handleBackToTours = () => {
    navigate('/tours');
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
        <Box sx={{ color: 'success.main', mb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 80 }} />
        </Box>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Booking Confirmed!
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          Thank you for your booking with 28 Degrees West
        </Typography>
        
        <Box sx={{ 
          maxWidth: 600, 
          mx: 'auto', 
          my: 4, 
          p: 3, 
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 1,
          textAlign: 'left'
        }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Booking Details
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Booking Reference
            </Typography>
            <Typography variant="body1" paragraph>
              {paymentIntentId}
            </Typography>
            
            {bookingDetails.tourName && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Tour
                </Typography>
                <Typography variant="body1" paragraph>
                  {bookingDetails.tourName}
                </Typography>
              </>
            )}
            
            {bookingDetails.date && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" paragraph>
                  {new Date(bookingDetails.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </>
            )}
            
            {bookingDetails.participants && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Participants
                </Typography>
                <Typography variant="body1" paragraph>
                  {bookingDetails.participants} {bookingDetails.participants === 1 ? 'person' : 'people'}
                </Typography>
              </>
            )}
            
            <Typography variant="body2" color="text.secondary">
              Total Amount Paid
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              ${amount.toFixed(2)}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" paragraph>
            A confirmation has been sent to your email address. If you have any questions about your booking, 
            please contact our support team at support@28degreeswest.com or call us at (876) 555-0123.
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleViewBookings}
          >
            View My Bookings
          </Button>
          
          <Button 
            variant="outlined" 
            size="large"
            onClick={handleBackToTours}
          >
            Back to Tours
          </Button>
        </Box>
        
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Contact our customer support team for assistance.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default BookingConfirmation;
