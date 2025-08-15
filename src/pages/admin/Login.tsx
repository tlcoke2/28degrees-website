import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // If already logged in, bounce to /admin
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) navigate('/admin', { replace: true });
  }, [navigate]);

  const valid = EMAIL_RE.test(email.trim()) && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!valid) return;

    setLoading(true);
    try {
      const baseURL =
        import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
      if (!baseURL) throw new Error('API base URL is not configured');

      const { data } = await axios.post(
        `${baseURL}/api/v1/admin/auth/login`,
        { email: email.trim().toLowerCase(), password },
        {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          withCredentials: true, // allow adminToken cookie to be set
          timeout: 15000,
        }
      );

      const token: string | undefined = data?.token || data?.data?.token;
      if (!token) throw new Error('No token returned from server');

      localStorage.setItem('adminToken', token);

      // Return to original location if provided, else /admin
      const target =
        location?.state?.from?.pathname && typeof location.state.from.pathname === 'string'
          ? location.state.from.pathname
          : '/admin';
      navigate(target, { replace: true });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to sign in. Please check your credentials.';
      setError(msg);
      if (import.meta.env.DEV) console.error('Admin login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Admin Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!email && !EMAIL_RE.test(email.trim())}
            helperText={email && !EMAIL_RE.test(email.trim()) ? 'Enter a valid email' : ' '}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !valid}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLogin;

