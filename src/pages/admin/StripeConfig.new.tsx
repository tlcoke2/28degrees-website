import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStripeConfig, updateStripeConfig, testStripeConnection } from '../../services/stripeService';

// Material-UI Components
import {
  Container, Typography, Paper, Grid, TextField, FormControl, FormControlLabel,
  FormHelperText, InputLabel, Select, MenuItem, Switch, Button, IconButton,
  InputAdornment, Divider, Box, CircularProgress, Alert, Chip, Tooltip
} from '@mui/material';

// Icons
import {
  Save as SaveIcon, Link as LinkIcon, Visibility, VisibilityOff,
  CheckCircleOutline, ErrorOutline, VpnKey as KeyIcon,
  Help as HelpIcon, Webhook as WebhookIcon
} from '@mui/icons-material';

// Types
type StripeConfigType = {
  isActive: boolean;
  isTestMode: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  commissionRate: number;
  currency: string;
  lastTested?: Date | string | null;
  testStatus?: 'not_tested' | 'success' | 'failed';
  testMessage?: string;
};

type StripeConfigForm = Omit<StripeConfigType, 'lastTested' | 'testStatus' | 'testMessage'> & {
  confirmSecretKey: string;
  confirmWebhookSecret: string;
};

const StripeConfig: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  
  const [config, setConfig] = useState<StripeConfigForm>({
    isActive: false,
    isTestMode: true,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    commissionRate: 0,
    currency: 'USD',
    confirmSecretKey: '',
    confirmWebhookSecret: ''
  });

  // Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      if (!currentUser?.isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const data = await getStripeConfig();
        if (data) {
          setConfig({
            ...data,
            confirmSecretKey: data.secretKey,
            confirmWebhookSecret: data.webhookSecret
          });
        }
      } catch (err) {
        setError('Failed to load Stripe configuration');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setConfig(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (config.secretKey !== config.confirmSecretKey) {
        throw new Error('Secret keys do not match');
      }

      if (config.webhookSecret && config.webhookSecret !== config.confirmWebhookSecret) {
        throw new Error('Webhook secrets do not match');
      }

      const { confirmSecretKey, confirmWebhookSecret, ...dataToSend } = config;
      await updateStripeConfig(dataToSend);
      setSuccess('Configuration saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('Testing connection to Stripe...');

    try {
      await testStripeConnection();
      setConnectionStatus('success');
      setConnectionMessage('Successfully connected to Stripe');
    } catch (err) {
      setConnectionStatus('error');
      setConnectionMessage(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Access denied</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Stripe Configuration</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.isActive}
                    onChange={handleToggle}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Enable Stripe Payments"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Publishable Key"
                name="publishableKey"
                value={config.publishableKey}
                onChange={handleChange}
                disabled={!config.isActive || saving}
                placeholder="pk_test_..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" gap={2} alignItems="center">
                <Button
                  variant="contained"
                  onClick={handleTestConnection}
                  disabled={!config.isActive || saving || connectionStatus === 'testing'}
                  startIcon={connectionStatus === 'testing' ? <CircularProgress size={20} /> : <LinkIcon />}
                >
                  Test Connection
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!config.isActive || saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Box>
              
              {connectionMessage && (
                <Box mt={2}>
                  <Alert severity={connectionStatus === 'error' ? 'error' : 'success'}>
                    {connectionMessage}
                  </Alert>
                </Box>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default StripeConfig;
