import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions, 
  TextField, Chip, MenuItem, Select, FormControl, InputLabel,
  Grid, Divider, CircularProgress, Snackbar, Alert, TablePagination
} from '@mui/material';
import { 
  Search as SearchIcon, FilterList, CheckCircle, Cancel, AccessTime, 
  Event as EventIcon, CalendarToday, Person, Email, People, Receipt,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { bookingService, Booking } from '../../services/api';
import { format, parseISO } from 'date-fns';
import { AxiosError } from 'axios';

// Using the Booking type from the API service instead of redefining it here

const BookingsManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
    totalPages: 0
  });
  const { isAdmin } = useAuth();

  // Load bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        const response = await bookingService.getAllBookings(
          pagination.page + 1, // API is 1-indexed, MUI is 0-indexed
          pagination.rowsPerPage,
          statusFilter === 'all' ? {} : { status: statusFilter }
        );
        
        setBookings(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        }));
        setError(null);
      } catch (err) {
        const error = err as Error;
        console.error('Error fetching bookings:', error);
        setError('Failed to load bookings. Please try again later.');
        showSnackbar('Failed to load bookings', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAdmin, pagination.page, pagination.rowsPerPage, statusFilter]);

  // Filter bookings based on search term
  useEffect(() => {
    if (!bookings.length) return;
    
    let result = [...bookings];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(booking => 
        (booking.customerName?.toLowerCase().includes(term) ||
        booking.customerEmail?.toLowerCase().includes(term) ||
        booking.bookingNumber?.toLowerCase().includes(term) ||
        booking.tourOrEvent?.title?.toLowerCase().includes(term)) ?? false
      );
    }
    
    setFilteredBookings(result);
  }, [searchTerm, bookings]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setSelectedBooking(null);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      setLoading(true);
      await bookingService.updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      );
      
      setBookings(updatedBookings);
      setFilteredBookings(updatedBookings);
      showSnackbar('Booking status updated successfully', 'success');
    } catch (err) {
      const error = err as Error;
      console.error('Error updating booking status:', error);
      showSnackbar(error.message || 'Failed to update booking status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        setLoading(true);
        await bookingService.cancelBooking(bookingId);
        
        // Update local state
        const updatedBookings = bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'cancelled' as const } : booking
        );
        
        setBookings(updatedBookings);
        setFilteredBookings(updatedBookings);
        showSnackbar('Booking cancelled successfully', 'success');
      } catch (err) {
        const error = err as Error;
        console.error('Error cancelling booking:', error);
        showSnackbar(error.message || 'Failed to cancel booking', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Chip icon={<CheckCircle />} label="Confirmed" color="success" size="small" />;
      case 'pending':
        return <Chip icon={<AccessTime />} label="Pending" color="warning" size="small" />;
      case 'cancelled':
        return <Chip icon={<Cancel />} label="Cancelled" color="error" size="small" />;
      case 'completed':
        return <Chip icon={<CheckCircle />} label="Completed" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getPaymentStatusChip = (status: string) => {
    switch (status) {
      case 'paid':
        return <Chip label="Paid" color="success" size="small" variant="outlined" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" variant="outlined" />;
      case 'refunded':
        return <Chip label="Refunded" color="info" size="small" variant="outlined" />;
      case 'failed':
        return <Chip label="Failed" color="error" size="small" variant="outlined" />;
      default:
        return <Chip label={status} size="small" variant="outlined" />;
    }
  };

  if (!isAdmin) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Bookings Management</Typography>
      </Box>

      {/* Filters and Search */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search bookings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as string)}
            label="Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Tour/Event</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell>{booking.bookingNumber}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {booking.customerName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {booking.customerEmail}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <EventIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2">
                            {booking.tourOrEvent.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {booking.tourOrEvent.type.toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.tourOrEvent.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusChip(booking.status)}</TableCell>
                    <TableCell>{getPaymentStatusChip(booking.paymentStatus)}</TableCell>
                    <TableCell>${booking.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleViewDetails(booking)}
                        sx={{ mr: 1 }}
                      >
                        View
                      </Button>
                      {booking.status !== 'cancelled' && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" py={3}>
                      No bookings found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={(e, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
          onRowsPerPageChange={(e) => {
            setPagination({
              ...pagination,
              page: 0,
              rowsPerPage: parseInt(e.target.value, 10)
            });
          }}
        />
      </Box>

      {/* Booking Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        {selectedBooking && (
          <>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Booking #{selectedBooking.bookingNumber}
                  </Typography>
                  <Typography variant="h6">{selectedBooking.tourOrEvent.title}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Customer</Typography>
                  <Typography>{selectedBooking.customerName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedBooking.customerEmail}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Booking Date
                  </Typography>
                  <Typography>
                    {format(new Date(selectedBooking.bookingDate), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Event Date
                  </Typography>
                  <Typography>
                    {format(new Date(selectedBooking.tourOrEvent.date), 'MMM dd, yyyy')}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Guests
                  </Typography>
                  <Typography>{selectedBooking.guests}</Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  {getStatusChip(selectedBooking.status)}
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Payment Status
                  </Typography>
                  {getPaymentStatusChip(selectedBooking.paymentStatus)}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6">
                    ${selectedBooking.totalAmount.toFixed(2)}
                  </Typography>
                </Grid>

                {selectedBooking.specialRequests && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Special Requests
                    </Typography>
                    <Typography>{selectedBooking.specialRequests}</Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
              {selectedBooking.status !== 'cancelled' && (
                <Button 
                  color="error" 
                  onClick={() => {
                    handleCancelBooking(selectedBooking.id);
                    handleCloseDetails();
                  }}
                >
                  Cancel Booking
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getAllBookings(
        pagination.page + 1, // API is 1-indexed, MUI is 0-indexed
        pagination.rowsPerPage,
        { status: statusFilter === 'all' ? '' : statusFilter }
      );
      
      setBookings(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages
      }));
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error fetching bookings:', error);
      setError(error.response?.data?.message || 'Failed to load bookings. Please try again.');
      showSnackbar(error.response?.data?.message || 'Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      page: 0, // Reset to first page
      rowsPerPage: parseInt(event.target.value, 10)
    }));
  };

  // Refresh bookings list
  const handleRefresh = () => {
    fetchBookings();
  };

  // Initial data load
  useEffect(() => {
    fetchBookings();
  }, [pagination.page, pagination.rowsPerPage, statusFilter]);

  // Handle status update
  const handleStatusUpdate = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      setLoading(true);
      await bookingService.updateBookingStatus(bookingId, newStatus);
      
      // Update local state
      const updatedBookings = bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      );
      
      setBookings(updatedBookings);
      showSnackbar('Booking status updated successfully', 'success');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error updating booking status:', error);
      showSnackbar(error.response?.data?.message || 'Failed to update booking status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        setLoading(true);
        await bookingService.cancelBooking(bookingId);
        
        // Update local state
        const updatedBookings = bookings.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
        );
        
        setBookings(updatedBookings);
        showSnackbar('Booking cancelled successfully', 'success');
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        console.error('Error cancelling booking:', error);
        showSnackbar(error.response?.data?.message || 'Failed to cancel booking', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

export default BookingsManagement;
