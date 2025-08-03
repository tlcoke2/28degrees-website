import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  Alert,
  Snackbar,
  CircularProgress,
  Link
} from '@mui/material';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updatePassword as firebaseUpdatePassword,
  AuthError
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { isAdminEmail } from '../../utils/adminAuth';
import { useAdmin } from '../../contexts/AdminContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, loading, requiresPasswordChange } = useAdmin();

  // Redirect if already logged in
  useEffect(() => {
    if (admin && !loading) {
      if (requiresPasswordChange) {
        setIsFirstLogin(true);
        setShowPasswordChange(true);
      } else {
        const returnTo = location.state?.from?.pathname || '/admin/dashboard';
        navigate(returnTo, { replace: true });
      }
    }
  }, [admin, loading, requiresPasswordChange, navigate, location]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      
      if (!isAdminEmail(email)) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login timestamp
      if (user) {
        await updateDoc(doc(db, 'admins', user.uid), {
          lastLogin: serverTimestamp()
        });
      }
      
      const successMessage = 'Login successful! Redirecting...';
      setMessage(successMessage);
      setSnackbarMessage(successMessage);
      setSnackbarOpen(true);
      
      // Redirect to admin dashboard after successful login
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1500);
      
    } catch (error: unknown) {
      const authError = error as AuthError;
      let errorMessage = 'Failed to log in';
      
      if (authError.code === 'auth/invalid-email' || 
          authError.code === 'auth/user-not-found' ||
          authError.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      setError(errorMessage);
      console.error('Admin login error:', authError);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(`Password reset email sent to ${email}. Please check your inbox.`);
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send password reset email. Please try again.');
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');
      
      // Update password in Firebase Auth
      await firebaseUpdatePassword(user, newPassword);
      
      // Update user record in Firestore
      await updateDoc(doc(db, 'admins', user.uid), {
        requiresPasswordChange: false,
        lastPasswordChange: serverTimestamp()
      });
      
      setMessage('Password updated successfully! Redirecting...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1500);
      
    } catch (err) {
      console.error('Password update error:', err);
      setError('Failed to update password. Please try again.');
      setIsLoading(false);
    }
  };

  // If already logged in but requires password change
  if (admin && requiresPasswordChange && !showPasswordChange) {
    return <Navigate to="/admin/change-password" state={{ from: location }} replace />;
  }
  
  // If already logged in and doesn't require password change, redirect to dashboard
  if (admin && !requiresPasswordChange) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, mb: 4 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          {isFirstLogin ? 'Welcome! Please Set Your Password' : 'Admin Login'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        
        {showPasswordChange ? (
          // Password Change Form
          <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isFirstLogin 
                ? 'This is your first login. Please set a new password.'
                : 'Please enter a new password.'}
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !newPassword || !confirmPassword}
              sx={{ mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Update Password'}
            </Button>
            
            {!isFirstLogin && (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowPasswordChange(false)}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            )}
          </Box>
        ) : (
          // Login Form
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 1 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Link 
                component="button" 
                variant="body2" 
                onClick={handlePasswordReset}
                disabled={isLoading || !email}
              >
                Forgot password?
              </Link>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || !email || !password}
              sx={{ mt: 1, mb: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Need help? Contact support@28degreeswest.com
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Secure Admin Portal • {new Date().getFullYear()} 28 Degrees West
        </Typography>
      </Box>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};
export default AdminLogin;
