import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';
import Home from './pages/Home';
import Tours from './pages/Tours';
import Bookings from './pages/Bookings';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminLogin from './pages/admin/Login';
import AdminRoutes from './routes/adminRoutes';
import { useAuth } from './hooks/useAuth';

// Main App component with routing
const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

// Separate component to use hooks at the top level
const AppContent = () => {
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
        <Route path="/contact" element={<Contact />} />
        
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
