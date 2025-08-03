import { Route, Routes, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminLayout from '../layouts/AdminLayout';
import { useAdmin } from '../contexts/AdminContext';

// Lazy load admin components
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const ToursManagement = lazy(() => import('../pages/admin/ToursManagement'));
const EventsManagement = lazy(() => import('../pages/admin/EventsManagement'));
const BookingsManagement = lazy(() => import('../pages/admin/BookingsManagement'));
const UsersManagement = lazy(() => import('../pages/admin/UsersManagement'));
const StripeConfig = lazy(() => import('../pages/admin/StripeConfig'));
const Settings = lazy(() => import('../pages/admin/Settings'));

// Wrapper component to handle admin authentication and layout
const AdminRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { admin, loading } = useAdmin();

  if (loading) {
    return <LoadingSpinner fullHeight />;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

// Wrapper for admin routes with layout and auth
const AdminRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => (
  <AdminRouteWrapper>
    <Suspense fallback={<LoadingSpinner fullHeight />}>
      {element}
    </Suspense>
  </AdminRouteWrapper>
);

const AdminRoutes = () => (
  <Routes>
    <Route 
      path="" 
      element={
        <AdminRouteWrapper>
          <Navigate to="dashboard" replace />
        </AdminRouteWrapper>
      } 
    />
    <Route 
      path="dashboard" 
      element={
        <AdminRoute element={<AdminDashboard />} />
      } 
    />
    <Route 
      path="tours" 
      element={
        <AdminRoute element={<ToursManagement />} />
      } 
    />
    <Route 
      path="events" 
      element={
        <AdminRoute element={<EventsManagement />} />
      } 
    />
    <Route 
      path="bookings" 
      element={
        <AdminRoute element={<BookingsManagement />} />
      } 
    />
    <Route 
      path="users" 
      element={
        <AdminRoute element={<UsersManagement />} />
      } 
    />
    <Route 
      path="stripe-config" 
      element={
        <AdminRoute element={<StripeConfig />} />
      } 
    />
    <Route 
      path="settings" 
      element={
        <AdminRoute element={<Settings />} />
      } 
    />
  </Routes>
);

export default AdminRoutes;
