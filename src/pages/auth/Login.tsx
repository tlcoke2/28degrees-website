import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/UserContext';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link as MuiLink,
  Alert,
} from '@mui/material';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login: React.FC = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation is handled inside UserContext.login
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to log in. Please check your credentials.';
      setError(apiMsg);
      if (import.meta.env.DEV) console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            type="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!fieldErrors.email}
            helperText={fieldErrors.email || ' '}
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
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || ' '}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 1.5, mb: 2 }}
            disabled={loading || !EMAIL_RE.test(email.trim()) || !password}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <MuiLink component={Link} to="/register" variant="body2">
              {"Don't have an account? Sign Up"}
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
