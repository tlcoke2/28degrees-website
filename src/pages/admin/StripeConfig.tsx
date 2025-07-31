import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getStripeConfig, updateStripeConfig, testStripeConnection } from '../../services/stripeService';

// Material-UI Components
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Button,
  IconButton,
  InputAdornment,
  Divider,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Tooltip
} from '@mui/material';

// Icons
import {
  Save as SaveIcon,
  Link as LinkIcon,
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  ErrorOutline,
  VpnKey as KeyIcon,
  Help as HelpIcon,
  Webhook as WebhookIcon
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
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
  updatedBy?: string;
  metadata?: Record<string, any>;
};

// Form data type
type StripeConfigForm = Omit<StripeConfigType, 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus' | 'testMessage' | 'createdBy' | 'updatedBy' | 'metadata'> & {
  confirmSecretKey: string;
  confirmWebhookSecret: string;
};

// User type from auth context
type User = {
  uid: string;
  email?: string | null;
  isAdmin?: boolean;
  [key: string]: any;
};

// Tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stripe-config-tabpanel-${index}`}
      aria-labelledby={`stripe-config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Tab properties
function a11yProps(index: number) {
  return {
    id: `stripe-config-tab-${index}`,
    'aria-controls': `stripe-config-tabpanel-${index}`,
  };
}

// Alert severity type
type AlertSeverity = 'error' | 'info' | 'success' | 'warning';

const StripeConfig = () => {
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState<StripeConfigForm>({
    isActive: false,
    isTestMode: true,
    publishableKey: '',
    secretKey: '',
    confirmSecretKey: '',
    webhookSecret: '',
    confirmWebhookSecret: '',
    commissionRate: 0,
    currency: 'USD',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastTested, setLastTested] = useState<Date | null>(null);
  const [testStatus, setTestStatus] = useState<'not_tested' | 'success' | 'failed'>('not_tested');
  const [testMessage, setTestMessage] = useState('');
  
  // Form validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Fetch Stripe configuration
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const config = await getStripeConfig();
      
      // Set the form state
      setConfig({
        ...config,
        confirmSecretKey: '',
        confirmWebhookSecret: ''
      });
      
      // Set test status
      if (config.lastTested) {
        setLastTested(new Date(config.lastTested));
      }
      
      if (config.testStatus) {
        setTestStatus(config.testStatus);
      }
      
      if (config.testMessage) {
        setTestMessage(config.testMessage);
      }
      
      setError('');
    } catch (err: any) {
      console.error('Error fetching Stripe config:', err);
      setError(err.message || 'Failed to load Stripe configuration');
    } finally {
      setLoading(false);
    }
  };
  
  // Load configuration on component mount
  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchConfig();
    } else {
      setLoading(false);
      setError('You do not have permission to access this page');
    }
  }, [currentUser]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) return;
    
    setConfig(prev => ({
      ...prev,
      [name]: numValue
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (config.isActive) {
      if (!config.publishableKey) {
        newErrors.publishableKey = 'Publishable key is required';
      } else if (!config.publishableKey.startsWith('pk_')) {
        newErrors.publishableKey = 'Invalid publishable key format';
      }
      
      if (!config.secretKey) {
        newErrors.secretKey = 'Secret key is required';
      } else if (!config.secretKey.startsWith('sk_')) {
        newErrors.secretKey = 'Invalid secret key format';
      }
      
      if (config.secretKey && config.secretKey !== config.confirmSecretKey) {
        newErrors.confirmSecretKey = 'Secret keys do not match';
      }
      
      if (config.webhookSecret && !config.webhookSecret.startsWith('whsec_')) {
        newErrors.webhookSecret = 'Invalid webhook secret format';
      }
      
      if (config.webhookSecret && config.webhookSecret !== config.confirmWebhookSecret) {
        newErrors.confirmWebhookSecret = 'Webhook secrets do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Prepare the data to send (exclude confirmation fields)
      const { confirmSecretKey, confirmWebhookSecret, ...dataToSend } = config;
      
      await updateStripeConfig(dataToSend);
      
      setSuccess('Stripe configuration saved successfully');
      
      // Refresh the config to get the latest data
      await fetchConfig();
      
    } catch (err: any) {
      console.error('Error saving Stripe config:', err);
      setError(err.message || 'Failed to save Stripe configuration');
    } finally {
      setSaving(false);
    }
  };
  
  // Test Stripe connection
  const testConnection = async () => {
    if (!config.isActive || !config.publishableKey || !config.secretKey) {
      setConnectionStatus('error');
      setConnectionMessage('Please fill in all required fields and enable Stripe first');
      return;
    }
    
    setConnectionStatus('testing');
    setConnectionMessage('Testing connection to Stripe...');
    
    try {
      const result = await testStripeConnection();
      setConnectionStatus('success');
      setConnectionMessage('Successfully connected to Stripe!');
      
      // Update test status
      setTestStatus('success');
      setTestMessage('Connection test successful');
      setLastTested(new Date());
      
    } catch (err: any) {
      console.error('Error testing Stripe connection:', err);
      setConnectionStatus('error');
      setConnectionMessage(err.message || 'Failed to connect to Stripe');
      
      // Update test status
      setTestStatus('failed');
      setTestMessage(err.message || 'Connection test failed');
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }
  
  // Render success message
  const renderSuccessMessage = () => {
    if (!success) return null;
    
    return (
      <Alert 
        severity="success" 
        sx={{ mb: 3 }}
        onClose={() => setSuccess('')}
      >
        {success}
      </Alert>
    );
  };
  
  // Render connection status
  const renderConnectionStatus = () => {
    if (connectionStatus === 'idle') return null;
    
    const statusProps = {
      testing: { severity: 'info', icon: <CircularProgress size={20} /> },
      success: { severity: 'success', icon: <CheckCircleOutline /> },
      error: { severity: 'error', icon: <ErrorOutline /> },
    }[connectionStatus];
    
    return (
      <Alert 
        severity={statusProps.severity}
        icon={statusProps.icon}
        sx={{ mb: 3 }}
      >
        {connectionMessage}
      </Alert>
    );
  };
  
  // Main render
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Stripe Configuration
      </Typography>
      
      {renderSuccessMessage()}
      {renderConnectionStatus()}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.isActive}
                    onChange={handleChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="Enable Stripe Payments"
              />
              <FormHelperText>
                Enable or disable Stripe payment processing
              </FormHelperText>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Publishable Key"
                name="publishableKey"
                value={config.publishableKey}
                onChange={handleChange}
                disabled={!config.isActive || saving}
                error={!!errors.publishableKey}
                helperText={errors.publishableKey || 'Stripe publishable key (starts with pk_)'}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Environment</InputLabel>
                <Select
                  value={config.isTestMode ? 'test' : 'live'}
                  onChange={(e) => {
                    setConfig(prev => ({
                      ...prev,
                      isTestMode: e.target.value === 'test'
                    }));
                  }}
                  label="Environment"
                  disabled={!config.isActive || saving}
                >
                  <MenuItem value="test">Test Mode</MenuItem>
                  <MenuItem value="live">Live Mode</MenuItem>
                </Select>
                <FormHelperText>
                  {config.isTestMode 
                    ? 'Using test API keys (starts with sk_test_)' 
                    : 'Using live API keys (starts with sk_live_)'}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Secret Key
              </Typography>
              
              <TextField
                fullWidth
                type={showSecretKey ? 'text' : 'password'}
                label="Secret Key"
                name="secretKey"
                value={config.secretKey}
                onChange={handleChange}
                disabled={!config.isActive || saving}
                error={!!errors.secretKey}
                helperText={errors.secretKey || `Stripe ${config.isTestMode ? 'test' : 'live'} secret key (starts with sk_${config.isTestMode ? 'test_' : 'live_'})`}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        edge="end"
                      >
                        {showSecretKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                type={showSecretKey ? 'text' : 'password'}
                label="Confirm Secret Key"
                name="confirmSecretKey"
                value={config.confirmSecretKey}
                onChange={handleChange}
                disabled={!config.isActive || saving}
                error={!!errors.confirmSecretKey}
                helperText={errors.confirmSecretKey || 'Re-enter the secret key to confirm'}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Webhook Settings (Optional)
              </Typography>
              
              <TextField
                fullWidth
                type={showWebhookSecret ? 'text' : 'password'}
                label="Webhook Secret"
                name="webhookSecret"
                value={config.webhookSecret}
                onChange={handleChange}
                disabled={!config.isActive || saving}
                error={!!errors.webhookSecret}
                helperText={errors.webhookSecret || 'Stripe webhook secret (starts with whsec_)'}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                        edge="end"
                      >
                        {showWebhookSecret ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                type={showWebhookSecret ? 'text' : 'password'}
                label="Confirm Webhook Secret"
                name="confirmWebhookSecret"
                value={config.confirmWebhookSecret}
                onChange={handleChange}
                disabled={!config.isActive || saving}
                error={!!errors.confirmWebhookSecret}
                helperText={errors.confirmWebhookSecret || 'Re-enter the webhook secret to confirm'}
                margin="normal"
              />
              
              <FormHelperText sx={{ mt: 1 }}>
                Webhook URL: {window.location.origin}/api/stripe/webhook
              </FormHelperText>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Commission Rate"
                name="commissionRate"
                value={config.commissionRate}
                onChange={handleNumberChange}
                disabled={!config.isActive || saving}
                error={!!errors.commissionRate}
                helperText={errors.commissionRate || 'Percentage commission (0-100)'}
                margin="normal"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 0, max: 100, step: 0.01 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Currency</InputLabel>
                <Select
                  value={config.currency}
                  onChange={handleSelectChange}
                  name="currency"
                  label="Currency"
                  disabled={!config.isActive || saving}
                >
                  {['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'SGD'].map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency} ({new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(1000).replace(/[0-9]/g, '')})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={testConnection}
                    disabled={!config.isActive || saving || connectionStatus === 'testing'}
                    startIcon={<Link />}
                    sx={{ mr: 2 }}
                  >
                    {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                  </Button>
                  
                  {lastTested && (
                    <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
                      Last tested: {new Date(lastTested).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!config.isActive || saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Box>
              
              {testStatus !== 'not_tested' && (
                <Box mt={2}>
                  <Chip
                    label={`Test Status: ${testStatus === 'success' ? 'Passed' : 'Failed'}`}
                    color={testStatus === 'success' ? 'success' : 'error'}
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                  {testMessage && (
                    <Typography variant="body2" color="textSecondary" component="span">
                      {testMessage}
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: config.isActive ? 'success.main' : 'error.main',
              mr: 1
            }}
          />
          <Typography>
            Stripe is {config.isActive ? 'enabled' : 'disabled'}
          </Typography>
        </Box>
        
        {config.isActive && (
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Environment:</strong> {config.isTestMode ? 'Test Mode' : 'Live Mode'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Publishable Key:</strong> {config.publishableKey ? `${config.publishableKey.substring(0, 8)}...${config.publishableKey.substring(config.publishableKey.length - 4)}` : 'Not set'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Secret Key:</strong> {config.secretKey ? '••••••••••••' + config.secretKey.substring(config.secretKey.length - 4) : 'Not set'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Webhook Secret:</strong> {config.webhookSecret ? '••••••••••••' + config.webhookSecret.substring(config.webhookSecret.length - 4) : 'Not set'}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Commission Rate:</strong> {config.commissionRate}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Currency:</strong> {config.currency}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear success/error messages when making changes
    if (success || error) {
      setSuccess('');
      setError('');
    }
    
    // Reset connection status when API keys change
    if (['publishableKey', 'secretKey'].includes(name)) {
      setConnectionStatus('idle');
      setConnectionMessage('');
    }
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow numbers and decimal points for commission rate
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setConfig(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    }
  };
  
  const handleToggleSecretKey = () => {
    setShowSecretKey(!showSecretKey);
  };
  
  const handleToggleWebhookSecret = () => {
    setShowWebhookSecret(!showWebhookSecret);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      const updatedConfig = await updateStripeConfig({
        ...config,
        // Ensure commissionRate is a number
        commissionRate: typeof config.commissionRate === 'string' 
          ? parseFloat(config.commissionRate) || 0 
          : config.commissionRate
      });
      
      setConfig(updatedConfig);
      setSuccess('Stripe configuration saved successfully!');
      
      // Test connection after saving if not already tested
      if (config.isActive && config.publishableKey && config.secretKey) {
        await testConnection();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
      console.error('Error saving Stripe config:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Stripe Payment Configuration
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={testConnection}
          disabled={connectionStatus === 'testing'}
          startIcon={
            connectionStatus === 'testing' ? (
              <CircularProgress size={20} />
            ) : connectionStatus === 'success' ? (
              <CheckCircle />
            ) : connectionStatus === 'error' ? (
              <ErrorIcon />
            ) : (
              <KeyIcon />
            )
          }
        >
          {connectionStatus === 'testing' 
            ? 'Testing...' 
            : connectionStatus === 'success' 
              ? 'Connected' 
              : connectionStatus === 'error'
                ? 'Connection Failed'
                : 'Test Connection'}
        </Button>
      </Box>
      
      {connectionMessage && (
        <Alert 
          severity={
            connectionStatus === 'success' ? 'success' : 
            connectionStatus === 'error' ? 'error' : 'info'
          } 
          sx={{ mb: 3 }}
        >
          {connectionMessage}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <KeyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            API Keys
          </Typography>
          <Tooltip title="Find your API keys in the Stripe Dashboard under Developers > API keys">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Configure your Stripe API keys to enable payment processing. You can find these in your{' '}
          <a 
            href="https://dashboard.stripe.com/apikeys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Stripe Dashboard
          </a>.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Publishable Key"
                name="publishableKey"
                value={config.publishableKey}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="pk_test_..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secret Key"
                name="secretKey"
                type="password"
                value={config.secretKey}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="sk_test_..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook Secret"
                name="webhookSecret"
                type="password"
                value={config.webhookSecret}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="whsec_..."
                helperText="Required for processing webhook events"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Payment Settings
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Commission Rate (%)"
                name="commissionRate"
                type="number"
                value={config.commissionRate}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                inputProps={{ min: 0, max: 100, step: 0.1 }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Currency"
                name="currency"
                value={config.currency}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                SelectProps={{ native: true }}
              >
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="JMD">JMD (J$)</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                size="large"
                sx={{ minWidth: 200 }}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
              
              {!config.isActive && (
                <FormHelperText sx={{ mt: 1 }}>
                  Note: Payment processing will be disabled until you enable Stripe
                </FormHelperText>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Card sx={{ mb: 4, borderLeft: '4px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <WebhookIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              Webhook Configuration
            </Typography>
          </Box>
          
          <Typography variant="body2" color="textSecondary" paragraph>
            Set up the following webhook endpoint in your{' '}
            <a 
              href="https://dashboard.stripe.com/webhooks" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Stripe Webhooks Dashboard
            </a>{' '}
            to receive payment events:
          </Typography>
          
          <Box 
            component="div"
            sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              overflowX: 'auto',
              fontFamily: 'monospace',
              mb: 2
            }}
          >
            {`${window.location.origin}/api/webhooks/stripe`}
          </Box>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 'medium' }}>
            Required Events to Subscribe:
          </Typography>
          
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li><code>checkout.session.completed</code></li>
            <li><code>payment_intent.succeeded</code></li>
            <li><code>payment_intent.payment_failed</code></li>
            <li><code>charge.refunded</code></li>
            <li><code>charge.failed</code></li>
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> Make sure to add your webhook signing secret above after creating the webhook in the Stripe Dashboard.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!success} 
        autoHideDuration={4000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StripeConfig;
