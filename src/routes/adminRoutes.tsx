import { Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Lazy load admin components
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const ToursManagement = lazy(() => import('../pages/admin/ToursManagement'));
const EventsManagement = lazy(() => import('../pages/admin/EventsManagement'));
const BookingsManagement = lazy(() => import('../pages/admin/BookingsManagement'));
const UsersManagement = lazy(() => import('../pages/admin/UsersManagement.new'));

const AdminRoutes = () => (
  <Routes>
    <Route 
      path="dashboard" 
      element={
        <ProtectedRoute adminOnly>
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="tours" 
      element={
        <ProtectedRoute adminOnly>
          <Suspense fallback={<LoadingSpinner />}>
            <ToursManagement />
          </Suspense>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="events" 
      element={
        <ProtectedRoute adminOnly>
          <Suspense fallback={<LoadingSpinner />}>
            <EventsManagement />
          </Suspense>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="bookings" 
      element={
        <ProtectedRoute adminOnly>
          <Suspense fallback={<LoadingSpinner />}>
            <BookingsManagement />
          </Suspense>
        </ProtectedRoute>
      } 
    />
    <Route 
      path="users" 
      element={
        <ProtectedRoute adminOnly>
          <Suspense fallback={<LoadingSpinner />}>
            <UsersManagement />
          </Suspense>
        </ProtectedRoute>
      } 
    />
  </Routes>
);

export default AdminRoutes;
