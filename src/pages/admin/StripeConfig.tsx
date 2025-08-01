import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStripeConfig, updateStripeConfig, type StripeConfig as StripeConfigType } from '../../services/stripeService';

// Material-UI Components
import { Container, Typography, Paper, Grid, TextField, FormControlLabel, Switch, Button, CircularProgress, Alert, Snackbar, Box } from '@mui/material';

interface StripeConfigForm extends Omit<StripeConfigType, 'updatedAt'> {
  // Add form-specific fields
  confirmSecretKey: string;
  confirmWebhookSecret: string;
}

const StripeConfig: React.FC = () => {
  const auth = useAuth();
  const isAdmin = auth?.isAdmin || false;
  const [config, setConfig] = useState<StripeConfigForm>({
    isActive: false,
    publishableKey: '',
    secretKey: '',
    confirmSecretKey: '',
    webhookSecret: '',
    confirmWebhookSecret: '',
    commissionRate: 0,
    currency: 'USD',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getStripeConfig();
        setConfig(prev => ({
          ...prev,
          ...data,
          confirmSecretKey: '',
          confirmWebhookSecret: '',
          isActive: data?.isActive ?? false,
          publishableKey: data?.publishableKey ?? '',
          secretKey: data?.secretKey ?? '',
          webhookSecret: data?.webhookSecret ?? '',
          commissionRate: data?.commissionRate ?? 0,
          currency: data?.currency ?? 'USD'
        }));
      } catch (err) {
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      loadConfig();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (config.secretKey !== config.confirmSecretKey) {
      setError('Secret keys do not match');
      return;
    }
    
    // Prepare the data to send to the API
    const { confirmSecretKey, confirmWebhookSecret, ...apiConfig } = config;
    
    try {
      await updateStripeConfig(apiConfig);
      setSuccess('Configuration saved successfully');
      
      // Refresh the config to get the latest data
      const updatedConfig = await getStripeConfig();
      setConfig(prev => ({
        ...prev,
        ...updatedConfig,
        confirmSecretKey: '',
        confirmWebhookSecret: ''
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">You do not have permission to access this page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>Stripe Configuration</Typography>
      
      {error && <Alert severity="error">{error}</Alert>}
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.isActive}
                    onChange={handleChange}
                    name="isActive"
                  />
                }
                label="Enable Stripe Payments"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Publishable Key"
                name="publishableKey"
                value={config.publishableKey}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Secret Key"
                name="secretKey"
                type="password"
                value={config.secretKey}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Container>
  );
};

export default StripeConfig;
