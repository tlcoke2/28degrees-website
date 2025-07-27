import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import Home from './pages/Home';
import Tours from './pages/Tours';
import Bookings from './pages/Bookings';
import About from './pages/About';
import Contact from './pages/Contact';
import CheckoutPage from './pages/CheckoutPage';
import BookingConfirmation from './pages/BookingConfirmation';
import TestPaymentFlow from './pages/TestPaymentFlow';
import SocialFeedPage from './pages/SocialFeedPage';
import AdminLogin from './pages/admin/Login';
import AdminRoutes from './routes/adminRoutes';
import { useAuth } from './hooks/useAuth';
import theme from './theme/theme';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App component with routing
const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider 
          maxSnack={3}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={5000}
        >
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </SnackbarProvider>
      </QueryClientProvider>
    </LocalizationProvider>
  </ThemeProvider>
);

// Separate component to use hooks at the top level
const AppContent = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <AppLayout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/about" element={<About />} />
        <Route path="/social" element={<SocialFeedPage />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Payment routes */}
        <Route 
          path="/checkout" 
          element={
            <Elements stripe={stripePromise}>
              <CheckoutPage />
            </Elements>
          } 
        />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        
        {/* Test payment route */}
        <Route path="/test-payment" element={<TestPaymentFlow />} />
        
        {/* Admin authentication */}
        <Route path="/admin/login" element={
          user ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />
        } />
        
        {/* Admin protected routes */}
        <Route path="/admin/*" element={
          user ? <AdminRoutes /> : <Navigate to="/admin/login" state={{ from: location }} replace />
        } />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
