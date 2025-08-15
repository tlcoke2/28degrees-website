import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminProtectedRoute from '../components/auth/AdminProtectedRoute';

// Lazy load admin pages
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const ToursManagement = lazy(() => import('../pages/admin/ToursManagement'));
const EventsManagement = lazy(() => import('../pages/admin/EventsManagement'));
const BookingsManagement = lazy(() => import('../pages/admin/BookingsManagement'));
const UsersManagement = lazy(() => import('../pages/admin/UsersManagement'));
const StripeConfig = lazy(() => import('../pages/admin/StripeConfig'));
const Settings = lazy(() => import('../pages/admin/Settings'));              // NEW
const ContentEditor = lazy(() => import('../pages/admin/ContentEditor'));    // NEW

const AdminRoutes: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      {/* Default /admin -> /admin/dashboard */}
      <Route index element={<Navigate to="dashboard" replace />} />

      <Route
        path="dashboard"
        element={
          <AdminProtectedRoute>
            <Dashboard />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="tours"
        element={
          <AdminProtectedRoute>
            <ToursManagement />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="events"
        element={
          <AdminProtectedRoute>
            <EventsManagement />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="bookings"
        element={
          <AdminProtectedRoute>
            <BookingsManagement />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="users"
        element={
          <AdminProtectedRoute>
            <UsersManagement />
          </AdminProtectedRoute>
        }
      />

      {/* Payments / Stripe settings */}
      <Route
        path="stripe-config"
        element={
          <AdminProtectedRoute>
            <StripeConfig />
          </AdminProtectedRoute>
        }
      />

      {/* Site-wide settings (general, email, security, etc.) */}
      <Route
        path="settings"
        element={
          <AdminProtectedRoute>
            <Settings />
          </AdminProtectedRoute>
        }
      />

      {/* CMS content editor (Home + About) */}
      <Route
        path="content"
        element={
          <AdminProtectedRoute>
            <ContentEditor />
          </AdminProtectedRoute>
        }
      />

      {/* Fallback for unknown /admin paths */}
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  </Suspense>
);

export default AdminRoutes;
