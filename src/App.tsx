import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import BookEvent from './pages/BookEvent';
import AdminRoutes from './routes/adminRoutes';
import { useAuth } from './contexts/UserContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useCookieConsent } from './contexts/CookieConsentContext';
import CookieConsent from './components/CookieConsent';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './config/stripe';
// Main App component with routing
const App: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <CookieConsentWrapper />
      <AppContent />
    </Elements>
  );
};

// Wrapper component for CookieConsent to use the hook
const CookieConsentWrapper: React.FC = () => {
  const { showConsent, updateCookieSettings, rejectAllCookies } = useCookieConsent();
  
  return (
    <CookieConsent 
      open={showConsent}
      onClose={() => updateCookieSettings({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      })}
      onAccept={updateCookieSettings}
      onReject={rejectAllCookies}
    />
  );
};

// Separate component to use hooks at the top level
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected user routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/book-event/:eventId" element={
          <ProtectedRoute>
            <BookEvent />
          </ProtectedRoute>
        } />
        
        {/* Payment routes */}
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <Elements stripe={stripePromise}>
                <CheckoutPage />
              </Elements>
            </ProtectedRoute>
          } 
        />
        
        <Route path="/booking-confirmation" element={
          <ProtectedRoute>
            <BookingConfirmation />
          </ProtectedRoute>
        } />
        
        {/* Test payment route */}
        <Route path="/test-payment" element={
          <ProtectedRoute>
            <TestPaymentFlow />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin">
          {/* Admin login - redirect to dashboard if already logged in */}
          <Route 
            index 
            element={
              user ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="login" replace />
            } 
          />
          <Route 
            path="login" 
            element={
              user ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />
            } 
          />
          
          {/* Protected admin routes */}
          <Route
            path="*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
        </Route>
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
