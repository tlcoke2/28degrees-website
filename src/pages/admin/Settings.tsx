import React, { useEffect, useState, useCallback } from 'react';
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
import type { SelectChangeEvent } from '@mui/material/Select';
import { Settings as SettingsIcon, Email, Lock, Language, Notifications, Receipt } from '@mui/icons-material';

import api from '../../services/api'; // ✅ default export from services/api.ts (already configured baseURL + interceptors)
import { SettingsFormData } from '../../types/settings';

// ---------- Tab panel ----------
interface TabPanelProps {
  children?: React.ReactNode;
  index: string;
  value: string;
}
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
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

// Basic email regex (kept light)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Component ----------
const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // --- Initial form state (safe defaults) ---
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

  const showSnack = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ---------- Helpers to set nested keys ----------
  const setNestedValue = useCallback(
    <K extends keyof SettingsFormData>(parent: K, child: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent] as Record<string, any>),
          [child]: value,
        } as any,
      }));
    },
    []
  );

  // ---------- Load settings from API ----------
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      // Preferred admin endpoint (protected)
      const res = await api.get<{ data: SettingsFormData } | SettingsFormData>('/admin/settings');
      const data = (res.data as any).data ?? res.data;
      setFormData((prev) => ({ ...prev, ...(data as SettingsFormData) }));
    } catch (err: any) {
      // Fallback to public (if you expose read-only)
      if (err?.response?.status === 404) {
        try {
          const pub = await api.get<{ data: Partial<SettingsFormData> } | Partial<SettingsFormData>>('/settings');
          const data = (pub.data as any).data ?? pub.data;
          setFormData((prev) => ({ ...prev, ...(data as Partial<SettingsFormData>) }));
        } catch (e: any) {
          setErrorText(e?.response?.data?.message || 'Failed to load settings');
          showSnack('Failed to load settings', 'error');
        }
      } else {
        setErrorText(err?.response?.data?.message || 'Failed to load settings');
        showSnack('Failed to load settings', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ---------- UI handlers ----------
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => setActiveTab(newValue);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNestedValue(parent as keyof SettingsFormData, child, type === 'checkbox' ? checked : value);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }) as SettingsFormData);
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (!name) return;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNestedValue(parent as keyof SettingsFormData, child, value);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'itemsPerPage' ? Number(value) : value,
    }) as SettingsFormData);
  };

  const handleSwitchChange =
    (name: string) =>
    (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setNestedValue(parent as keyof SettingsFormData, child, checked);
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }) as SettingsFormData);
      }
    };

  // ---------- Validation ----------
  const validate = (): string | null => {
    if (!formData.siteTitle.trim()) return 'Site title is required.';
    if (!EMAIL_RE.test(formData.contactEmail)) return 'Please provide a valid contact email.';
    if (formData.enableAnalytics && !formData.googleAnalyticsId.trim()) {
      return 'Google Analytics is enabled—please provide a Tracking ID.';
    }
    if (formData.enableEmailNotifications && !EMAIL_RE.test(formData.emailSender)) {
      return 'Please provide a valid email sender address.';
    }
    // Basic sanity:
    if (!Number.isFinite(formData.itemsPerPage) || formData.itemsPerPage < 1) {
      return 'Items per page must be at least 1.';
    }
    return null;
  };

  // ---------- Save settings to API ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      showSnack(err, 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Preferred admin endpoint (protected)
      const res = await api.put('/admin/settings', formData);
      if (res.status >= 200 && res.status < 300) {
        showSnack('Settings saved successfully', 'success');
        // Optionally reload to reflect any server-side normalization
        await loadSettings();
      } else {
        showSnack('Failed to save settings', 'error');
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save settings';
      showSnack(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSnackbarClose = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // ---------- Render content ----------
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

        {/* GENERAL */}
        <TabPanel value={activeTab} index="general">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Site Title"
                name="siteTitle"
                value={formData.siteTitle}
                onChange={handleTextChange}
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
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Contact Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
                required
                error={!!formData.contactEmail && !EMAIL_RE.test(formData.contactEmail)}
                helperText={
                  !!formData.contactEmail && !EMAIL_RE.test(formData.contactEmail)
                    ? 'Invalid email address'
                    : ' '
                }
              />
              <TextField
                fullWidth
                label="Contact Phone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleTextChange}
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
                  <MenuItem value="JMD">JMD (J$)</MenuItem>
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
                  <MenuItem value="America/Jamaica">America/Jamaica</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.maintenanceMode}
                    onChange={handleSwitchChange('maintenanceMode')}
                    name="maintenanceMode"
                    color="primary"
                  />
                }
                label="Maintenance Mode"
                sx={{ mt: 2, display: 'block' }}
              />
              <FormHelperText>When enabled, only administrators can access the site.</FormHelperText>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.allowRegistrations}
                    onChange={handleSwitchChange('allowRegistrations')}
                    name="allowRegistrations"
                    color="primary"
                  />
                }
                label="Allow New User Registrations"
                sx={{ mt: 2, display: 'block' }}
              />
            </Grid>

            {/* Social links */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Social Media</Typography>
              <Grid container spacing={2}>
                {(['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'] as const).map((key) => (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      fullWidth
                      label={key[0].toUpperCase() + key.slice(1)}
                      name={`socialMedia.${key}`}
                      value={(formData.socialMedia as any)[key] || ''}
                      onChange={handleTextChange}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* APPEARANCE */}
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
                  value={String(formData.itemsPerPage)}
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

            {/* SEO */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">SEO</Typography>
              <TextField
                fullWidth
                label="Meta Title"
                name="seo.metaTitle"
                value={formData.seo.metaTitle}
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Meta Description"
                name="seo.metaDescription"
                value={formData.seo.metaDescription}
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Meta Keywords (comma separated)"
                name="seo.metaKeywords"
                value={formData.seo.metaKeywords}
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* EMAIL */}
        <TabPanel value={activeTab} index="email">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableEmailNotifications}
                    onChange={handleSwitchChange('enableEmailNotifications')}
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
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
                error={!!formData.emailSender && !EMAIL_RE.test(formData.emailSender)}
                helperText={
                  !!formData.emailSender && !EMAIL_RE.test(formData.emailSender)
                    ? 'Invalid email address'
                    : 'This email will be used as the From address for system emails.'
                }
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* SECURITY */}
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
                <FormHelperText>This role is assigned to new users when they register.</FormHelperText>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableAnalytics}
                    onChange={handleSwitchChange('enableAnalytics')}
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
                onChange={handleTextChange}
                margin="normal"
                variant="outlined"
                disabled={!formData.enableAnalytics}
                helperText="Enter your GA4 Tracking ID (e.g., G-XXXXXXXXXX)"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* NOTIFICATIONS (placeholder for future granular settings) */}
        <TabPanel value={activeTab} index="notifications">
          <Alert severity="info">Granular notification preferences can be managed here.</Alert>
        </TabPanel>

        {/* BILLING (placeholder) */}
        <TabPanel value={activeTab} index="billing">
          <Alert severity="info">Billing & payment related settings can be managed here.</Alert>
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

      {errorText ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorText}
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Configure your website settings and preferences here.
        </Alert>
      )}

      {renderTabContent()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
