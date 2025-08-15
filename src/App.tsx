import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import AppLayout from './components/Layout/AppLayout';
import Home from './pages/Home';
import Tours from './pages/Tours';
import Bookings from './pages/Bookings';
import About from './pages/About';
import Contact from './pages/Contact';
import CheckoutPage from './pages/CheckoutPage';
import BookingConfirmation from './pages/BookingConfirmation';
import TestPaymentFlow from './pages/TestPaymentFlow';
import TestPayment from './pages/TestPayment';
import TestStripeIntegration from './pages/TestStripeIntegration';
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

// ✅ centralized axios with baseURL already set to `${VITE_API_BASE_URL}/api/v1`
import { api } from './services/http';

/* -------------------- Cookie consent wrapper -------------------- */
const CookieConsentWrapper: React.FC = () => {
  const { showConsent, updateCookieSettings, rejectAllCookies } = useCookieConsent();
  return (
    <CookieConsent
      open={showConsent}
      onClose={() =>
        updateCookieSettings({ necessary: true, analytics: false, marketing: false, preferences: false })
      }
      onAccept={updateCookieSettings}
      onReject={rejectAllCookies}
    />
  );
};

/* ---------------------- Admin session verifier ---------------------- */
function useAdminSession() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('adminToken');
        if (!token) {
          if (!cancelled) {
            setAuthed(false);
            setChecking(false);
          }
          return;
        }

        // Build a safe URL using the axios client's baseURL (already includes /api/v1)
        const base = (api.defaults.baseURL || '').replace(/\/+$/, '');
        const url = `${base}/admin/auth/me`;

        // Use fetch here to AVOID global axios 401 redirectors during boot
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!cancelled) {
          if (res.ok) {
            setAuthed(true);
          } else {
            localStorage.removeItem('adminToken');
            setAuthed(false);
          }
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          setAuthed(false);
          setChecking(false);
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  return { checking, authed };
}

/* ---------------------- Admin protected route ---------------------- */
function AdminProtectedRoute({
  children,
  session,
}: {
  children: JSX.Element;
  session: { checking: boolean; authed: boolean };
}) {
  const location = useLocation();
  const { checking, authed } = session;

  if (checking) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!authed) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
}

/* --------------------------- Main App --------------------------- */
const App: React.FC = () => {
  return (
    // Only wrap Elements ONCE here (do not re-wrap on /checkout)
    <Elements stripe={stripePromise}>
      <CookieConsentWrapper />
      <AppContent />
    </Elements>
  );
};

/* ---------------------------- Routes ---------------------------- */
const AppContent: React.FC = () => {
  const { loading } = useAuth();

  // Compute admin session ONCE here and pass it down
  const adminSession = useAdminSession();

  if (loading) return <div>Loading…</div>;

  return (
    <AppLayout>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/about" element={<About />} />
        <Route path="/social" element={<SocialFeedPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-event/:eventId"
          element={
            <ProtectedRoute>
              <BookEvent />
            </ProtectedRoute>
          }
        />

        {/* Payment (Elements already provided at top) */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-confirmation"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />

        {/* Map backend success/cancel URLs to existing pages */}
        <Route path="/payment/success" element={<BookingConfirmation />} />
        <Route path="/payment/cancel" element={<Navigate to="/bookings" replace />} />

        {/* Test payment routes (keep behind auth if they hit live endpoints) */}
        <Route
          path="/test-payment"
          element={
            <ProtectedRoute>
              <TestPaymentFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-stripe"
          element={
            <ProtectedRoute>
              <TestPayment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/test-stripe-integration"
          element={
            <ProtectedRoute>
              <TestStripeIntegration />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/login"
          element={
            adminSession.checking ? (
              <div>Loading…</div>
            ) : adminSession.authed ? (
              <Navigate to="/admin" replace />
            ) : (
              <AdminLogin />
            )
          }
        />
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute session={adminSession}>
              <AdminRoutes />
            </AdminProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;

