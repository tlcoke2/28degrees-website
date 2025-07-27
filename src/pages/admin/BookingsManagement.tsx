import React, { useState } from 'react';
import { 
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, Select, MenuItem, FormControl, 
  InputLabel, Snackbar, Alert, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Paper, SelectChangeEvent
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Booking } from '../../types/booking';

// Define a type for the form data
type BookingFormData = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;

// Custom GridItem component to handle the 'item' prop correctly
const GridItem = ({ children, ...props }: any) => (
  <Grid item {...props}>
    {children}
  </Grid>
);

const BookingsManagement: React.FC = () => {
  const [bookings] = useState<Booking[]>([]);
  const [open, setOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Partial<BookingFormData>>({
    tourId: '',
    userId: '',
    date: '',
    participants: 1,
    status: 'pending',
    specialRequests: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | 
       SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name) {
      setCurrentBooking(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', currentBooking);
    setOpen(false);
  };

  // Handle delete booking
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      console.log('Delete booking:', id);
    }
  };

  // Handle edit booking
  const handleEdit = (booking: Booking) => {
    setCurrentBooking(booking);
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
            setCurrentBooking({
              tourId: '',
              userId: '',
              date: '',
              participants: 1,
              status: 'pending',
              specialRequests: ''
            });
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
              <TableCell>Participants</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.tourId}</TableCell>
                  <TableCell>{booking.userId}</TableCell>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>{booking.participants}</TableCell>
                  <TableCell>{booking.status}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(booking)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => booking.id && handleDelete(booking.id)}>
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
        <form onSubmit={handleSubmit}>
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
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Participants"
                  name="participants"
                  type="number"
                  value={currentBooking.participants || 1}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={currentBooking.status || 'pending'}
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
              startIcon={loading ? <CircularProgress size={20} /> : null}
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
