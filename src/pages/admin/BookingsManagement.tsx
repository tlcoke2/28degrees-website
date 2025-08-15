import React, { useState } from 'react';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, TextField, Select, MenuItem, FormControl,
  InputLabel, Snackbar, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Paper
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Booking } from '../../types/booking';

// Form data is the Booking minus system-managed fields
type BookingFormData = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

// Minimal status union (ensure it matches your backend/Booking type)
type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

// Custom GridItem helper
const GridItem: React.FC<React.ComponentProps<typeof Grid>> = ({ children, ...props }) => (
  <Grid item {...props}>
    {children}
  </Grid>
);

// Helper to coerce values by field name (numbers vs strings)
function coerceValue(name: string, value: unknown) {
  if (name === 'participants') {
    const n = parseInt(String(value), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  if (name === 'status') return (String(value) as BookingStatus);
  return value;
}

const emptyForm: BookingFormData = {
  tourId: '',
  userId: '',
  date: '',
  participants: 1,
  status: 'pending',
  specialRequests: '',
};

const BookingsManagement: React.FC = () => {
  const [bookings] = useState<Booking[]>([]); // TODO: fetch from API
  const [open, setOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Partial<BookingFormData>>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [loading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Unified change handler for TextField and Select
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name } = target;
    const value = (e as SelectChangeEvent<string>).target?.value ?? target.value;

    if (!name) return;
    setCurrentBooking(prev => ({
      ...prev,
      [name]: coerceValue(name, value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!currentBooking.tourId?.trim()) {
      return setSnackbar({ open: true, message: 'Tour ID is required.', severity: 'error' });
    }
    if (!currentBooking.userId?.trim()) {
      return setSnackbar({ open: true, message: 'User ID is required.', severity: 'error' });
    }
    if (!currentBooking.date) {
      return setSnackbar({ open: true, message: 'Date is required.', severity: 'error' });
    }

    // TODO: call create/update API
    console.log(isEditing ? 'Updating booking:' : 'Creating booking:', currentBooking);

    setOpen(false);
    setSnackbar({
      open: true,
      message: isEditing ? 'Booking updated.' : 'Booking created.',
      severity: 'success',
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      // TODO: call delete API
      console.log('Delete booking:', id);
      setSnackbar({ open: true, message: 'Booking deleted.', severity: 'success' });
    }
  };

  const mapBookingToForm = (b: Booking): BookingFormData => ({
    tourId: b.tourId,
    userId: b.userId,
    date: b.date,
    participants: b.participants,
    status: b.status as BookingStatus,
    specialRequests: b.specialRequests ?? '',
  });

  const handleEdit = (booking: Booking) => {
    setCurrentBooking(mapBookingToForm(booking));
    setIsEditing(true);
    setOpen(true);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <h2>Bookings Management</h2>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentBooking(emptyForm);
            setIsEditing(false);
            setOpen(true);
          }}
        >
          Add Booking
        </Button>
      </Box>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tour ID</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Participants</TableCell>
              <TableCell>Status</TableCell>
              <TableCell width={120}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.tourId}</TableCell>
                  <TableCell>{booking.userId}</TableCell>
                  <TableCell>
                    {booking.date
                      ? new Date(booking.date).toLocaleDateString()
                      : ''}
                  </TableCell>
                  <TableCell align="right">{booking.participants}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{booking.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(booking)} aria-label="edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => booking.id && handleDelete(booking.id)}
                      aria-label="delete"
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Booking Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit} noValidate>
          <DialogTitle>{isEditing ? 'Edit Booking' : 'Add New Booking'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tour ID"
                  name="tourId"
                  value={currentBooking.tourId || ''}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="User ID"
                  name="userId"
                  value={currentBooking.userId || ''}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={currentBooking.date || ''}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Participants"
                  name="participants"
                  type="number"
                  value={currentBooking.participants ?? 1}
                  onChange={handleChange}
                  required
                  margin="normal"
                  inputProps={{ min: 1 }}  // ✅ correct prop (was InputProps.inputProps)
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={(currentBooking.status as BookingStatus) || 'pending'}
                    onChange={handleChange}
                    label="Status"
                    required
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Special Requests"
                  name="specialRequests"
                  value={currentBooking.specialRequests || ''}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  margin="normal"
                />
              </GridItem>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : undefined}
            >
              {isEditing ? 'Update' : 'Create'} Booking
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookingsManagement;

