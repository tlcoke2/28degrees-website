// src/pages/Bookings.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, Typography, Box, Button, TextField, Alert, Paper, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchCatalog, CatalogItem } from '../services/catalog';
import { createCheckoutSession } from '../services/paymentService';
import { API_V1 } from '../config/env';

interface BookingFormData {
  itemId: string;
  itemType: 'tour' | 'event' | 'vip' | 'product' | '';
  fullName: string;
  email: string;
  phone: string;
  date: string;
  numberOfPeople: number;
  specialRequests: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---- NEW: type guard so we can safely check optional `slug`
type CatalogItemMaybeSlug = CatalogItem & { slug?: string };
const hasSlug = (i: CatalogItem): i is CatalogItemMaybeSlug =>
  typeof (i as any).slug === 'string' && (i as any).slug.length > 0;

const currencyFmt = (amountCents: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format((amountCents || 0) / 100);

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);

  const [formData, setFormData] = useState<BookingFormData>({
    itemId: '',
    itemType: '',
    fullName: '',
    email: '',
    phone: '',
    date: '',
    numberOfPeople: 1,
    specialRequests: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const itemsOfType: CatalogItem[] = useMemo(
    () => (formData.itemType ? catalog.filter((i) => i.type === formData.itemType) : catalog),
    [catalog, formData.itemType]
  );

  // Load catalog + preselect by route param if present
  useEffect(() => {
    let active = true;

    (async () => {
      setLoadingCatalog(true);
      setErrorMessage('');
      try {
        const items: CatalogItem[] = await fetchCatalog();
        if (!active) return;
        setCatalog(items);

        if (id) {
          // ✅ Works whether your API returns slug or not
          const found = items.find((i) => i.id === id || (hasSlug(i) && i.slug === id));
          if (found) {
            setFormData((prev) => ({
              ...prev,
              itemId: found.id,
              itemType: found.type,
            }));
          }
        }
      } catch {
        if (!active) return;
        setErrorMessage('Failed to load available bookings. Please refresh or try later.');
      } finally {
        if (active) setLoadingCatalog(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  const update =
    <K extends keyof BookingFormData>(key: K) =>
    (value: BookingFormData[K]) =>
      setFormData((prev) => ({ ...prev, [key]: value }));

  const validate = (): string | null => {
    if (!formData.itemId) return 'Please select an item to book.';
    if (!formData.fullName.trim()) return 'Full name is required.';
    if (!EMAIL_RE.test(formData.email)) return 'Please enter a valid email address.';
    if (!formData.phone.trim()) return 'Phone number is required.';
    if (!formData.date) return 'Preferred date is required.';
    if (Number.isNaN(formData.numberOfPeople) || formData.numberOfPeople < 1)
      return 'Number of people must be at least 1.';
    return null;
  };

  const handleTypeChange = (e: SelectChangeEvent<string>) => {
    const t = e.target.value as BookingFormData['itemType'];
    update('itemType')(t);
    update('itemId')(''); // Clear selection when switching type
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSuccessMessage('');
    setErrorMessage('');

    const err = validate();
    if (err) return setErrorMessage(err);

    setSubmitting(true);
    try {
      const payload = {
        tourId: formData.itemId, // backend expects tourId
        date: formData.date,
        quantity: formData.numberOfPeople,
        customerInfo: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        metadata: {
          specialRequests: formData.specialRequests || '',
          itemType: formData.itemType || '',
        },
      };

      const { url } = await createCheckoutSession(payload);
      window.location.assign(url);
      return;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[Bookings] checkout error:', err);
        setErrorMessage(String(err?.message || 'Booking error (see console for details).'));
      } else {
        setErrorMessage(String(err?.message || 'Error submitting booking. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const catalogEmpty = !loadingCatalog && catalog.length === 0;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center">
          Book Your Experience
        </Typography>

        {import.meta.env.DEV && (
          <Alert severity="info" sx={{ mb: 2 }}>
            API base: {API_V1}
          </Alert>
        )}

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

        <Paper component="form" onSubmit={handleFormSubmit} elevation={3} sx={{ p: 4, maxWidth: 700, mx: 'auto' }}>
          <Typography variant="h5" component="h3" gutterBottom>
            Booking Details
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required disabled={loadingCatalog || catalogEmpty}>
              <InputLabel id="type-label">Category</InputLabel>
              <Select
                labelId="type-label"
                label="Category"
                value={formData.itemType}
                onChange={handleTypeChange}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                <MenuItem value="tour">Tours</MenuItem>
                <MenuItem value="event">Events</MenuItem>
                <MenuItem value="vip">VIP Exclusive</MenuItem>
                <MenuItem value="product">Products</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required disabled={loadingCatalog || catalogEmpty}>
              <InputLabel id="item-label">Select Item</InputLabel>
              <Select
                labelId="item-label"
                label="Select Item"
                value={formData.itemId}
                onChange={(e) => update('itemId')(e.target.value as string)}
              >
                {itemsOfType.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} — {currencyFmt((item as any).priceCents ?? 0, (item as any).currency || 'USD')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={(e) => update('fullName')(e.target.value)}
              required
            />
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={(e) => update('email')(e.target.value)}
              required
              error={!!formData.email && !EMAIL_RE.test(formData.email)}
              helperText={!!formData.email && !EMAIL_RE.test(formData.email) ? 'Invalid email format' : ' '}
            />
            <TextField
              fullWidth
              type="tel"
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => update('phone')(e.target.value)}
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Preferred Date"
              name="date"
              value={formData.date}
              onChange={(e) => update('date')(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Number of People"
              name="numberOfPeople"
              type="number"
              value={formData.numberOfPeople}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                update('numberOfPeople')(Number.isNaN(v) ? 1 : Math.max(1, v));
              }}
              inputProps={{ min: 1 }}
              required
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Special Requests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => update('specialRequests')(e.target.value)}
            />

            {!formData.itemId && (
              <Alert severity="info">Please select a category and an item before proceeding.</Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
              disabled={submitting || !formData.itemId || loadingCatalog || catalogEmpty}
            >
              {submitting ? 'Processing…' : 'Proceed to Payment'}
            </Button>
          </Box>
        </Paper>

        <Button variant="contained" color="secondary" onClick={() => navigate('/tours')} sx={{ mt: 2 }}>
          Back to Tours
        </Button>
      </Container>
    </Box>
  );
};

export default Bookings;





