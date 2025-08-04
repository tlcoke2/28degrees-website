import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Alert,
  CircularProgress,
  Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

interface CustomImportMetaEnv {
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  [key: string]: any;
}

declare global {
  interface ImportMetaEnv extends CustomImportMetaEnv {}
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const AdminLogin: React.FC = () => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [firebaseConfig, setFirebaseConfig] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    // For development, display Firebase config
    if (process.env.NODE_ENV !== 'production') {
      console.log('Firebase Config:', {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '***' + import.meta.env.VITE_FIREBASE_API_KEY.slice(-4) : 'Not set',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not set',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set',
        appId: import.meta.env.VITE_FIREBASE_APP_ID ? '***' + import.meta.env.VITE_FIREBASE_APP_ID.slice(-4) : 'Not set'
      });
    }

    setFirebaseConfig({
      'API Key': import.meta.env.VITE_FIREBASE_API_KEY ? '***' + import.meta.env.VITE_FIREBASE_API_KEY.slice(-4) : 'Not set',
      'Auth Domain': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Not set',
      'Project ID': import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Not set',
      'App ID': import.meta.env.VITE_FIREBASE_APP_ID ? '***' + import.meta.env.VITE_FIREBASE_APP_ID.slice(-4) : 'Not set',
      'Current User': auth.currentUser ? `Logged In (${auth.currentUser.email || 'no email'})` : 'Not logged in'
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@28degreeswest.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    if (formData.email !== adminEmail || formData.password !== adminPassword) {
      setError('Invalid email or password');
      return;
    }

    try {
      await login(adminEmail, adminPassword);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to log in. Please check your credentials and try again.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Admin Login
        </Typography>

        {/* Firebase Config Debug Section (Hidden in Production) */}
        {process.env.NODE_ENV !== 'production' && (
          <Box sx={{ mt: 3, mb: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
            <Box
              onClick={() => setShowConfig(!showConfig)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              <Typography variant="subtitle2">
                {showConfig ? 'Hide Firebase Config' : 'Show Firebase Configuration'}
              </Typography>
              {showConfig ? <ExpandLess /> : <ExpandMore />}
            </Box>

            <Collapse in={showConfig}>
              <Box sx={{ mt: 2, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {Object.entries(firebaseConfig).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              color="primary"
              fullWidth
              size="large"
              type="submit"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default AdminLogin;

