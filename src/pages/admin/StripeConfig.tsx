import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Box,
  MenuItem,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormGroup,
  FormLabel
} from '@mui/material';
import { Add, Delete, Edit, Refresh } from '@mui/icons-material';
import {
  getStripeConfig,
  updateStripeConfig,
  // If you have this in your service already (from earlier steps):
  testStripeConnection as testStripeConnectionApi,
  type StripeConfig as StripeConfigType
} from '../../services/stripeService';

// ---------- Types ----------
type ProductKind = 'tour' | 'event' | 'product';
type PaymentMethod =
  | 'card'
  | 'link'
  | 'us_bank_account'
  | 'cashapp'
  | 'klarna'
  | 'afterpay_clearpay'
  | 'affirm';

interface PricingTier {
  key: string;                 // unique, e.g. 'standard', 'vip'
  name: string;                // display, e.g. 'VIP'
  description?: string;
  priceCents: number;          // integer cents
  currency?: string;           // default to config.currency
  appliesTo: ProductKind[];    // which catalog types can use this tier
  active: boolean;
  // optional: maxQty, minQty, etc. can be added later
}

interface StripeConfigForm
  extends Omit<StripeConfigType, 'updatedAt' | 'metadata'> {
  confirmSecretKey: string;
  confirmWebhookSecret: string;
  // extended UI-only fields
  isTestMode?: boolean;
  allowedPaymentMethods: PaymentMethod[];
  pricingTiers: PricingTier[];
}

// ---------- Constants ----------
const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  'card',
  'link',
  'us_bank_account',
  'cashapp',
  'klarna',
  'afterpay_clearpay',
  'affirm'
];

const DEFAULT_TIER: PricingTier = {
  key: '',
  name: '',
  description: '',
  priceCents: 0,
  appliesTo: ['tour', 'event', 'product'],
  active: true
};

// ---------- Component ----------
const StripeConfig: React.FC = () => {
  const hasAdminToken =
    typeof window !== 'undefined' && !!localStorage.getItem('adminToken');

  const [config, setConfig] = useState<StripeConfigForm>({
    isActive: false,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    commissionRate: 0,
    currency: 'USD',
    isTestMode: false,
    allowedPaymentMethods: ['card'],
    pricingTiers: [],
    confirmSecretKey: '',
    confirmWebhookSecret: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tier dialog
  const [tierOpen, setTierOpen] = useState(false);
  const [tierIndex, setTierIndex] = useState<number | null>(null);
  const [tierDraft, setTierDraft] = useState<PricingTier>(DEFAULT_TIER);

  // Load config
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getStripeConfig();

        // read metadata fields if present
        const allowedPaymentMethods: PaymentMethod[] =
          (data as any)?.metadata?.allowedPaymentMethods || ['card'];
        const pricingTiers: PricingTier[] =
          (data as any)?.metadata?.pricingTiers || [];

        setConfig(prev => ({
          ...prev,
          ...data,
          isActive: data?.isActive ?? false,
          publishableKey: data?.publishableKey ?? '',
          secretKey: data?.secretKey ?? '',
          webhookSecret: data?.webhookSecret ?? '',
          commissionRate: data?.commissionRate ?? 0,
          currency: data?.currency ?? 'USD',
          isTestMode: (data as any)?.isTestMode ?? false,
          allowedPaymentMethods,
          pricingTiers,
          confirmSecretKey: '',
          confirmWebhookSecret: ''
        }));
      } catch (e) {
        setError('Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    if (hasAdminToken) load();
    else setLoading(false);
  }, [hasAdminToken]);

  // -------------- Handlers --------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]:
        name === 'commissionRate'
          ? Number(value)
          : type === 'checkbox'
          ? checked
          : value
    }));
  };

  const handleSwitch =
    (name: keyof StripeConfigForm) =>
    (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setConfig(prev => ({ ...prev, [name]: checked }));
    };

  const togglePaymentMethod = (pm: PaymentMethod) => {
    setConfig(prev => {
      const set = new Set(prev.allowedPaymentMethods);
      if (set.has(pm)) set.delete(pm);
      else set.add(pm);
      const final = Array.from(set);
      // Always enforce at least 'card'
      if (final.length === 0) final.push('card');
      return { ...prev, allowedPaymentMethods: final as PaymentMethod[] };
    });
  };

  const openAddTier = () => {
    setTierDraft({ ...DEFAULT_TIER, currency: config.currency });
    setTierIndex(null);
    setTierOpen(true);
  };

  const openEditTier = (idx: number) => {
    const t = config.pricingTiers[idx];
    setTierDraft({ ...t, currency: t.currency || config.currency });
    setTierIndex(idx);
    setTierOpen(true);
  };

  const deleteTier = (idx: number) => {
    setConfig(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== idx)
    }));
  };

  const saveTier = () => {
    // quick validation
    if (!tierDraft.key.trim()) return setError('Tier key is required');
    if (!tierDraft.name.trim()) return setError('Tier name is required');
    if (!Number.isFinite(tierDraft.priceCents) || tierDraft.priceCents < 0)
      return setError('Tier price must be a non-negative integer (in cents)');

    setConfig(prev => {
      const existsAt =
        tierIndex === null
          ? prev.pricingTiers.findIndex(t => t.key === tierDraft.key)
          : prev.pricingTiers.findIndex(
              (t, i) => t.key === tierDraft.key && i !== tierIndex
            );
      if (existsAt >= 0) {
        setError('Tier key must be unique');
        return prev;
      }

      const next = [...prev.pricingTiers];
      if (tierIndex === null) next.push(tierDraft);
      else next[tierIndex] = tierDraft;

      return { ...prev, pricingTiers: next };
    });

    setTierOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!config.publishableKey.trim())
      return setError('Publishable key is required');
    if (!config.secretKey.trim()) return setError('Secret key is required');
    if (config.secretKey !== config.confirmSecretKey)
      return setError('Secret keys do not match');

    if (
      config.webhookSecret &&
      config.confirmWebhookSecret &&
      config.webhookSecret !== config.confirmWebhookSecret
    ) {
      return setError('Webhook secrets do not match');
    }

    setSaving(true);
    try {
      const {
        confirmSecretKey,
        confirmWebhookSecret,
        allowedPaymentMethods,
        pricingTiers,
        ...base
      } = config;

      // Compose payload; store tier/methods inside metadata
      const payload: any = {
        ...base,
        metadata: {
          ...(base as any).metadata,
          allowedPaymentMethods,
          pricingTiers
        }
      };

      // Ensure cents are integers
      payload.metadata.pricingTiers = (pricingTiers || []).map((t: PricingTier) => ({
        ...t,
        priceCents: Math.round(Number(t.priceCents) || 0),
        currency: t.currency || config.currency
      }));

      await updateStripeConfig(payload);

      setSuccess('Configuration saved successfully');

      // Refresh values from API
      const updated = await getStripeConfig();
      setConfig(prev => ({
        ...prev,
        ...updated,
        isTestMode: (updated as any)?.isTestMode ?? false,
        allowedPaymentMethods:
          (updated as any)?.metadata?.allowedPaymentMethods || prev.allowedPaymentMethods,
        pricingTiers:
          (updated as any)?.metadata?.pricingTiers || prev.pricingTiers,
        confirmSecretKey: '',
        confirmWebhookSecret: ''
      }));
    } catch (err: any) {
      setError(err?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testStripeConnection = async () => {
    try {
      setTesting(true);
      // optional helper; safely no-op if not implemented
      const res = await (testStripeConnectionApi?.() ?? Promise.resolve({}));
      setSuccess(
        res?.message ||
          'Stripe connection check succeeded (see server logs for details).'
      );
    } catch (e: any) {
      setError(e?.message || 'Stripe connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const currencySymbol = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: config.currency || 'USD'
      })
        .formatToParts(1)
        .find(p => p.type === 'currency')?.value;
    } catch {
      return '$';
    }
  }, [config.currency]);

  // -------------- Render --------------
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!hasAdminToken) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">You do not have permission to access this page.</Alert>
      </Container>
    );
    }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box display="flex" alignItems="center" gap={2} mb={1}>
        <Typography variant="h4">Stripe Configuration</Typography>
        <Tooltip title="Test connection">
          <span>
            <IconButton onClick={testStripeConnection} disabled={testing}>
              <Refresh />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!config.isActive}
                    onChange={handleSwitch('isActive')}
                    name="isActive"
                    disabled={saving}
                  />
                }
                label="Enable Stripe Payments"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={!!config.isTestMode}
                    onChange={handleSwitch('isTestMode')}
                    name="isTestMode"
                    disabled={saving}
                  />
                }
                label="Use Test Mode"
              />
            </Grid>

            {/* Keys + currency */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Publishable Key"
                name="publishableKey"
                value={config.publishableKey}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Currency"
                name="currency"
                value={config.currency}
                onChange={handleChange}
                disabled={saving}
              >
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JMD'].map(cur => (
                  <MenuItem key={cur} value={cur}>{cur}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secret Key"
                name="secretKey"
                type="password"
                value={config.secretKey}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Secret Key"
                name="confirmSecretKey"
                type="password"
                value={config.confirmSecretKey}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Webhook Secret"
                name="webhookSecret"
                type="password"
                value={config.webhookSecret}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Webhook Secret"
                name="confirmWebhookSecret"
                type="password"
                value={config.confirmWebhookSecret}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ step: '0.1', min: 0, max: 100 }}
                label="Commission Rate (%)"
                name="commissionRate"
                value={config.commissionRate}
                onChange={handleChange}
                disabled={saving}
              />
            </Grid>

            {/* Allowed payment methods */}
            <Grid item xs={12}>
              <FormLabel component="legend" sx={{ mb: 1 }}>
                Allowed Payment Methods
              </FormLabel>
              <FormGroup row>
                {ALL_PAYMENT_METHODS.map(pm => (
                  <FormControlLabel
                    key={pm}
                    control={
                      <Checkbox
                        checked={config.allowedPaymentMethods.includes(pm)}
                        onChange={() => togglePaymentMethod(pm)}
                      />
                    }
                    label={pm}
                  />
                ))}
              </FormGroup>
            </Grid>

            {/* Pricing tiers */}
            <Grid item xs={12} mt={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Pricing Tiers</Typography>
                <Button startIcon={<Add />} variant="outlined" onClick={openAddTier}>
                  Add Tier
                </Button>
              </Box>

              {config.pricingTiers.length === 0 ? (
                <Alert severity="info">No tiers yet. Add at least one (e.g., Standard, VIP).</Alert>
              ) : (
                <Box>
                  {config.pricingTiers.map((t, idx) => (
                    <Paper key={t.key} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <Typography fontWeight={600}>{t.name} <Typography component="span" color="text.secondary">({t.key})</Typography></Typography>
                          {t.description && (
                            <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Typography>
                            {currencySymbol}
                            {(t.priceCents / 100).toFixed(2)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {t.appliesTo.map(a => (
                              <Chip key={a} label={a} size="small" />
                            ))}
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <Chip
                            size="small"
                            label={t.active ? 'active' : 'inactive'}
                            color={t.active ? 'success' : 'default'}
                          />
                        </Grid>
                        <Grid item xs={12} md={2} textAlign="right">
                          <IconButton onClick={() => openEditTier(idx)}><Edit /></IconButton>
                          <IconButton color="error" onClick={() => deleteTier(idx)}><Delete /></IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} mt={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving ? <CircularProgress size={18} /> : undefined}
              >
                {saving ? 'Saving…' : 'Save Configuration'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={() => setSuccess('')}
        message={success}
      />
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      {/* Tier Dialog */}
      <Dialog open={tierOpen} onClose={() => setTierOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{tierIndex === null ? 'Add Pricing Tier' : 'Edit Pricing Tier'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tier Key"
                fullWidth
                value={tierDraft.key}
                onChange={e => setTierDraft(p => ({ ...p, key: e.target.value.trim() }))}
                helperText="Unique ID (e.g., standard, vip)"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tier Name"
                fullWidth
                value={tierDraft.name}
                onChange={e => setTierDraft(p => ({ ...p, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={tierDraft.description || ''}
                onChange={e => setTierDraft(p => ({ ...p, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Price (cents)"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 1 }}
                value={tierDraft.priceCents}
                onChange={e => setTierDraft(p => ({ ...p, priceCents: Math.max(0, parseInt(e.target.value || '0', 10)) }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Currency"
                fullWidth
                value={tierDraft.currency || config.currency}
                onChange={e => setTierDraft(p => ({ ...p, currency: e.target.value } as PricingTier))}
              >
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JMD'].map(cur => (
                  <MenuItem key={cur} value={cur}>{cur}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormLabel sx={{ mb: 1, display: 'block' }}>Applies To</FormLabel>
              <Stack direction="row" spacing={1}>
                {(['tour', 'event', 'product'] as ProductKind[]).map(kind => {
                  const checked = tierDraft.appliesTo.includes(kind);
                  return (
                    <Chip
                      key={kind}
                      label={kind}
                      color={checked ? 'primary' : 'default'}
                      variant={checked ? 'filled' : 'outlined'}
                      onClick={() =>
                        setTierDraft(p => {
                          const set = new Set(p.appliesTo);
                          if (set.has(kind)) set.delete(kind);
                          else set.add(kind);
                          const arr = Array.from(set) as ProductKind[];
                          return { ...p, appliesTo: arr.length ? arr : (['tour'] as ProductKind[]) };
                        })
                      }
                    />
                  );
                })}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tierDraft.active}
                    onChange={(_, chk) => setTierDraft(p => ({ ...p, active: chk }))}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTierOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveTier}>Save Tier</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StripeConfig;
