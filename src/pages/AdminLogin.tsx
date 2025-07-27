import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Extend ImportMetaEnv to include our environment variables
interface CustomImportMetaEnv {
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  [key: string]: any; // Allow other properties
}

// Extend the existing ImportMeta interface
declare global {
  interface ImportMetaEnv extends CustomImportMetaEnv {}
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const AdminLogin: React.FC = () => {
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    
    // For demo purposes, use environment variables if provided
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@28degreeswest.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    
    try {
      if (formData.email === adminEmail || formData.email === 'admin@28degreeswest.com') {
        await login(adminEmail, adminPassword);
        // Redirect to admin dashboard after successful login
        navigate('/admin');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please check your credentials and try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Admin Login
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

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
                disabled={loading}
              />
              
              <TextField
                fullWidth
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              
              <Button
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin;
