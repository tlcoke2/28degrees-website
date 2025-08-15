import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  TablePagination
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';

import { eventService } from '../../services/api';
import type { Event as ApiEvent, EventCategory } from '../../types/event';

// ---- Local form type (omit server-managed fields) ----
type EventFormData = Omit<ApiEvent, 'id' | 'createdAt' | 'updatedAt'> & {
  // Ensure optional fields are present in the form state
  id?: string; // only used when editing (not sent on create)
};

// ---- Small helper for Grid item ----
const GridItem: React.FC<React.ComponentProps<typeof Grid>> = ({ children, ...props }) => (
  <Grid item {...props}>{children}</Grid>
);

// ---- Defaults for a new event ----
const defaultEvent: EventFormData = {
  title: '',
  description: '',
  date: '',         // yyyy-mm-dd
  time: '',         // HH:mm
  location: '',
  price: 0,
  capacity: 50,
  featured: false,
  category: 'general' as EventCategory,
  type: 'other' as any,   // keep if your schema includes a type field
  imageUrl: ''
};

const EventsManagement: React.FC = () => {
  // Full dataset (we’ll slice it for client-side pagination)
  const [allEvents, setAllEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Dialog + form state
  const [open, setOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentEvent, setCurrentEvent] = useState<EventFormData>(defaultEvent);

  // Pagination state (client-side)
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // ------- Fetch all events (once on mount) -------
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await eventService.getAllEvents(); // returns PaginatedResponse<any> in your api.ts
      // Your current api.ts: getAllEvents -> returns { data, total, ... }
      const data = resp?.data ?? (Array.isArray(resp) ? resp : []);
      setAllEvents(data as ApiEvent[]);
    } catch (err: any) {
      showSnack(err?.message || 'Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnack]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ------- Slice for client-side pagination -------
  const pagedEvents = useMemo(() => {
    const start = page * rowsPerPage;
    return allEvents.slice(start, start + rowsPerPage);
  }, [allEvents, page, rowsPerPage]);

  // ------- Input handlers -------
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCurrentEvent(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'capacity' ? Number(value) : value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string | number | boolean>) => {
    const { name, value } = e.target as { name: string; value: unknown };
    setCurrentEvent(prev => ({ ...prev, [name]: value as any }));
  };

  const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentEvent(prev => ({ ...prev, featured: e.target.checked }));
  };

  // ------- Open dialog for create -------
  const openCreate = () => {
    setCurrentEvent(defaultEvent);
    setIsEditing(false);
    setOpen(true);
  };

  // ------- Open dialog for edit -------
  const openEdit = (ev: ApiEvent) => {
    // Map API event to form shape (strip id/createdAt/updatedAt)
    const { id, createdAt, updatedAt, ...rest } = ev as any;
    setCurrentEvent({ ...defaultEvent, ...rest, id });
    setIsEditing(true);
    setOpen(true);
  };

  // ------- Submit create/update -------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && currentEvent.id) {
        const { id, ...updateData } = currentEvent;
        await eventService.updateEvent(id, updateData as any);
        showSnack('Event updated successfully');
      } else {
        const { id, ...createData } = currentEvent;
        await eventService.createEvent(createData as any);
        showSnack('Event created successfully');
      }
      setOpen(false);
      await fetchEvents();
    } catch (err: any) {
      showSnack(err?.message || 'Failed to save event', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ------- Delete event -------
  const handleDelete = async (id: string) => {
    const ok = window.confirm('Are you sure you want to delete this event?');
    if (!ok) return;

    setSaving(true);
    try {
      await eventService.deleteEvent(id);
      showSnack('Event deleted successfully');
      await fetchEvents();
    } catch (err: any) {
      showSnack(err?.message || 'Failed to delete event', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ------- Pagination controls -------
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Events Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Add Event
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Date / Time</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Featured</TableCell>
                <TableCell>Category</TableCell>
                <TableCell width={140} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : pagedEvents.length > 0 ? (
                pagedEvents.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{ev.title}</TableCell>
                    <TableCell>
                      {ev.date}{ev.time ? ` ${ev.time}` : ''}
                    </TableCell>
                    <TableCell>{ev.location}</TableCell>
                    <TableCell align="right">
                      {typeof ev.price === 'number' ? `$${ev.price.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {ev.featured ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>{(ev as any).category || 'general'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => openEdit(ev)} aria-label="Edit event">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => ev.id && handleDelete(ev.id)}
                        aria-label="Delete event"
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No events found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={allEvents.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={currentEvent.title}
                  onChange={handleTextChange}
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
                  value={currentEvent.date}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Time"
                  name="time"
                  type="time"
                  value={currentEvent.time}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </GridItem>

              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={currentEvent.location}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={currentEvent.price}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={currentEvent.capacity}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="event-category-label">Category</InputLabel>
                  <Select
                    labelId="event-category-label"
                    name="category"
                    value={(currentEvent.category || 'general') as EventCategory}
                    onChange={handleSelectChange}
                    label="Category"
                    required
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="music">Music</MenuItem>
                    <MenuItem value="sports">Sports</MenuItem>
                    <MenuItem value="food">Food & Drink</MenuItem>
                    <MenuItem value="arts">Arts & Culture</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="imageUrl"
                  value={currentEvent.imageUrl || ''}
                  onChange={handleTextChange}
                  margin="normal"
                />
              </GridItem>

              <GridItem xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="featured"
                      checked={!!currentEvent.featured}
                      onChange={handleFeaturedChange}
                    />
                  }
                  label="Featured Event"
                />
              </GridItem>

              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={currentEvent.description}
                  onChange={handleTextChange}
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
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : undefined}
            >
              {isEditing ? 'Update' : 'Create'} Event
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

export default EventsManagement;

