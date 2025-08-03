import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Switch, 
  FormControlLabel, 
  Tabs, 
  Tab, 
  Snackbar, 
  CircularProgress,
  FormHelperText,
  Alert
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAdmin } from '../../contexts/AdminContext';
import { Settings as SettingsIcon, Email, Lock, Language, Notifications, Receipt } from '@mui/icons-material';
import { SettingsFormData } from '../../types/settings';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: string;
  value: string;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings = () => {
  const { admin: _admin } = useAdmin();
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning',
  });

  // Initialize form data with default values
  const [formData, setFormData] = useState<SettingsFormData>({
    siteTitle: '28° West',
    siteDescription: 'Adventure Tours & Travel',
    contactEmail: 'info@28degreeswest.com',
    contactPhone: '',
    address: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
    },
    seo: {
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
    },
    maintenanceMode: false,
    allowRegistrations: true,
    defaultUserRole: 'user',
    currency: 'USD',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    itemsPerPage: 10,
    enableAnalytics: false,
    googleAnalyticsId: '',
    enableEmailNotifications: true,
    emailSender: 'noreply@28degreeswest.com',
  });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await api.get('/settings');
        // setFormData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load settings',
          severity: 'error',
        });
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle nested objects in form data
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof SettingsFormData] as object),
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'itemsPerPage' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // TODO: Replace with actual API call
      // await api.put('/settings', formData);
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Tab panels
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab icon={<SettingsIcon />} label="General" value="general" />
          <Tab icon={<Language />} label="Appearance" value="appearance" />
          <Tab icon={<Email />} label="Email" value="email" />
          <Tab icon={<Lock />} label="Security" value="security" />
          <Tab icon={<Notifications />} label="Notifications" value="notifications" />
          <Tab icon={<Receipt />} label="Billing" value="billing" />
        </Tabs>

        <TabPanel value={activeTab} index="general">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site Title"
                name="siteTitle"
                value={formData.siteTitle}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Site Description"
                name="siteDescription"
                value={formData.siteDescription}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Contact Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                required
              />
              <TextField
                fullWidth
                label="Contact Phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleSelectChange}
                  label="Currency"
                >
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                  <MenuItem value="CAD">CAD (C$)</MenuItem>
                  <MenuItem value="AUD">AUD (A$)</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="timezone-label">Timezone</InputLabel>
                <Select
                  labelId="timezone-label"
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleSelectChange}
                  label="Timezone"
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                  <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.maintenanceMode}
                    onChange={handleChange}
                    name="maintenanceMode"
                    color="primary"
                  />
                }
                label="Maintenance Mode"
                sx={{ mt: 2, display: 'block' }}
              />
              <FormHelperText>
                When enabled, only administrators can access the site.
              </FormHelperText>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowRegistrations}
                    onChange={handleChange}
                    name="allowRegistrations"
                    color="primary"
                  />
                }
                label="Allow New User Registrations"
                sx={{ mt: 2, display: 'block' }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index="appearance">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="date-format-label">Date Format</InputLabel>
                <Select
                  labelId="date-format-label"
                  id="dateFormat"
                  name="dateFormat"
                  value={formData.dateFormat}
                  onChange={handleSelectChange}
                  label="Date Format"
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel id="time-format-label">Time Format</InputLabel>
                <Select
                  labelId="time-format-label"
                  id="timeFormat"
                  name="timeFormat"
                  value={formData.timeFormat}
                  onChange={handleSelectChange}
                  label="Time Format"
                >
                  <MenuItem value="12h">12-hour (2:30 PM)</MenuItem>
                  <MenuItem value="24h">24-hour (14:30)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel id="items-per-page-label">Items Per Page</InputLabel>
                <Select
                  labelId="items-per-page-label"
                  id="itemsPerPage"
                  name="itemsPerPage"
                  value={formData.itemsPerPage.toString()}
                  onChange={handleSelectChange}
                  label="Items Per Page"
                >
                  <MenuItem value="5">5</MenuItem>
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="25">25</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                  <MenuItem value="100">100</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index="email">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableEmailNotifications}
                    onChange={handleChange}
                    name="enableEmailNotifications"
                    color="primary"
                  />
                }
                label="Enable Email Notifications"
                sx={{ mb: 2, display: 'block' }}
              />
              
              <TextField
                fullWidth
                label="Email Sender Address"
                name="emailSender"
                type="email"
                value={formData.emailSender}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                helperText="This email will be used as the 'from' address for all system emails."
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index="security">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="default-role-label">Default User Role</InputLabel>
                <Select
                  labelId="default-role-label"
                  id="defaultUserRole"
                  name="defaultUserRole"
                  value={formData.defaultUserRole}
                  onChange={handleSelectChange}
                  label="Default User Role"
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="guide">Guide</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </Select>
                <FormHelperText>
                  This role will be assigned to new users when they register.
                </FormHelperText>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableAnalytics}
                    onChange={handleChange}
                    name="enableAnalytics"
                    color="primary"
                  />
                }
                label="Enable Google Analytics"
                sx={{ mt: 2, display: 'block' }}
              />
              
              <TextField
                fullWidth
                label="Google Analytics ID"
                name="googleAnalyticsId"
                value={formData.googleAnalyticsId}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                disabled={!formData.enableAnalytics}
                helperText="Enter your Google Analytics tracking ID (e.g., UA-XXXXXXXXX-X)"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </form>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Configure your website settings and preferences here.
      </Alert>

      {renderTabContent()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
