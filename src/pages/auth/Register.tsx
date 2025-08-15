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

const Register: React.FC = () => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string; name?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: typeof fieldErrors = {};

    if (!name.trim()) errs.name = 'Full name is required';
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirm = 'Passwords do not match';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      // UserContext.register should attach passwordConfirm on the request body.
      await register(name.trim(), email.trim().toLowerCase(), password);
      // Navigation is handled inside UserContext.register to avoid double redirects.
    } catch (err: any) {
      // Surface best possible error message
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create an account. Please try again.';
      setError(apiMsg);
      if (import.meta.env.DEV) console.error('Registration error:', err);
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
          Create Account
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
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!fieldErrors.name}
            helperText={fieldErrors.name || ' '}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            type="email"
            label="Email Address"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!fieldErrors.password}
            helperText={fieldErrors.password || ' '}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!fieldErrors.confirm}
            helperText={fieldErrors.confirm || ' '}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 1.5, mb: 2 }}
            disabled={
              loading ||
              !name.trim() ||
              !EMAIL_RE.test(email.trim()) ||
              password.length < 8 ||
              password !== confirmPassword
            }
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <MuiLink component={Link} to="/login" variant="body2">
              Already have an account? Sign In
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
