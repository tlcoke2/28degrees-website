import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Divider, Container, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type BookingDetails = {
  tourId?: string;
  tourName?: string;
  date?: string;        // ISO string
  participants?: number;
  // extend as needed
};

interface LocationState {
  paymentIntentId: string;
  amount: number;       // in major units (e.g., 120.50)
  bookingDetails: BookingDetails;
}

const fmtCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount || 0);

const toNumberOr = (v: unknown, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const toIntOr = (v: unknown, fallback = 0) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
};

const BookingConfirmation: React.FC = () => {
  const navigate = useNavigate();

  // location.state may be null when user loads the page directly
  const location = useLocation() as ReturnType<typeof useLocation> & {
    state?: Partial<LocationState> | null;
  };
  const state = (location.state ?? null) as Partial<LocationState> | null;

  // Fallbacks from query params (e.g., Stripe success URL appends ?pi=... etc.)
  const search = new URLSearchParams(location.search);
  const qpPaymentIntentId = search.get('pi') || search.get('payment_intent') || undefined;
  const qpAmount = toNumberOr(search.get('amount'), undefined);
  const qpName = search.get('name') || undefined;
  const qpDate = search.get('date') || undefined;
  const qpQty = toIntOr(search.get('qty'), undefined);

  // Safely derive values (state wins; otherwise use query params; otherwise defaults)
  const paymentIntentId = state?.paymentIntentId || qpPaymentIntentId || 'N/A';
  const amount = typeof state?.amount === 'number' ? state.amount : (qpAmount ?? 0);

  const bookingDetails: BookingDetails = {
    tourId: state?.bookingDetails?.tourId,
    tourName: state?.bookingDetails?.tourName || qpName,
    date: state?.bookingDetails?.date || qpDate,
    participants:
      typeof state?.bookingDetails?.participants === 'number'
        ? state.bookingDetails.participants
        : (qpQty ?? undefined),
  };

  const handleViewBookings = () => {
    navigate('/my-bookings');
  };

  const handleBackToTours = () => {
    navigate('/tours');
  };

  const hasDirectOpen = !state && !qpPaymentIntentId; // likely opened directly without context

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

        {hasDirectOpen && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            We couldn’t find full booking details for this page load. If you arrived here directly,
            your confirmation has still been sent by email. You can view all bookings via “View My Bookings.”
          </Alert>
        )}

        <Box
          sx={{
            maxWidth: 600,
            mx: 'auto',
            my: 4,
            p: 3,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 1,
            textAlign: 'left',
          }}
        >
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Booking Details
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Booking Reference
            </Typography>
            <Typography variant="body1" paragraph sx={{ wordBreak: 'break-all' }}>
              {paymentIntentId}
            </Typography>

            {bookingDetails.tourName && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Experience
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
                  {new Date(bookingDetails.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </>
            )}

            {typeof bookingDetails.participants === 'number' && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Participants
                </Typography>
                <Typography variant="body1" paragraph>
                  {bookingDetails.participants}{' '}
                  {bookingDetails.participants === 1 ? 'person' : 'people'}
                </Typography>
              </>
            )}

            <Typography variant="body2" color="text.secondary">
              Total Amount Paid
            </Typography>
            <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
              {fmtCurrency(amount, 'USD')}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary" paragraph>
            A confirmation has been sent to your email address. If you have any questions about your booking,
            please contact our support team at <strong>support@28degreeswest.com</strong>.
          </Typography>
        </Box>

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" color="primary" size="large" onClick={handleViewBookings}>
            View My Bookings
          </Button>

          <Button variant="outlined" size="large" onClick={handleBackToTours}>
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

