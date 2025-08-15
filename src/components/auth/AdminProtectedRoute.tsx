import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { api } from '../../services/http'; // your axios instance (optional validation)

const AdminProtectedRoute: React.FC<{ children: React.ReactNode; validate?: boolean }> = ({
  children,
  validate = false, // set true if you want to call /admin/auth/me on entry
}) => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  // Quick block when no token
  if (!token) return <Navigate to="/admin/login" state={{ from: location }} replace />;

  // Optional live validation with backend (keeps it snappy if false)
  // You can delete everything in this block if you don't want live validation here.
  const [ok, setOk] = React.useState(validate ? null : true);
  React.useEffect(() => {
    let mounted = true;
    if (!validate) return;
    (async () => {
      try {
        await api.get('/admin/auth/me');
        if (mounted) setOk(true);
      } catch {
        localStorage.removeItem('adminToken');
        if (mounted) setOk(false);
      }
    })();
    return () => { mounted = false; };
  }, [validate]);

  if (ok === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  if (ok === false) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;

