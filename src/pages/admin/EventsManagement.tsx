import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, 
  Select, MenuItem, FormControl, InputLabel, Checkbox, 
  FormControlLabel, CircularProgress, Snackbar, Alert, Chip
} from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { eventService } from '../../services/api';
import { Event as EventType, EventType as EventTypeEnum } from '../../types/event';

type EventFormData = Omit<EventType, 'id' | 'createdAt' | 'updatedAt'> & {
  time?: string;
  includesAccommodation?: boolean;
  includesTransport?: boolean;
  includesMeals?: boolean;
  maxAttendees?: number;
};

const EventsManagement: React.FC = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [open, setOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<EventFormData>({ 
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    location: '',
    price: 0,
    imageUrl: '',
    type: 'other',
    featured: false,
    capacity: 50,
    includesAccommodation: false,
    includesTransport: false,
    includesMeals: false,
    maxAttendees: 100
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });
  const { isAdmin } = useAuth();

  // Event types with their display names and icons
  const eventTypes = [
    { value: 'concert' as const, label: 'Concert', icon: <EventIcon /> },
    { value: 'festival' as const, label: 'Festival', icon: <EventIcon /> },
    { value: 'exhibition' as const, label: 'Exhibition', icon: <EventIcon /> },
    { value: 'workshop' as const, label: 'Workshop', icon: <EventIcon /> },
    { value: 'other' as const, label: 'Other', icon: <EventIcon /> },
  ] as const;

  // Load events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await eventService.getAllEvents();
        setEvents(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
        showSnackbar('Failed to load events', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpen = (eventData?: EventType) => {
    if (eventData) {
      setCurrentEvent({ 
        ...eventData,
        // Ensure all required fields are included
        title: eventData.title || '',
        description: eventData.description || '',
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: 'time' in eventData ? eventData.time : '12:00',
        location: eventData.location || '',
        price: eventData.price || 0,
        imageUrl: eventData.imageUrl || '',
        type: eventData.type || 'other',
        featured: eventData.featured || false,
        capacity: eventData.capacity || 50,
        includesAccommodation: 'includesAccommodation' in eventData ? eventData.includesAccommodation : false,
        includesTransport: 'includesTransport' in eventData ? eventData.includesTransport : false,
        includesMeals: 'includesMeals' in eventData ? eventData.includesMeals : false,
        maxAttendees: 'maxAttendees' in eventData ? eventData.maxAttendees : 100
      });
      setIsEditing(true);
    } else {
      setCurrentEvent({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        price: 0,
        imageUrl: '',
        type: 'other',
        featured: false,
        capacity: 50,
        includesAccommodation: false,
        includesTransport: false,
        includesMeals: false,
        maxAttendees: 100
      });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentEvent({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      location: '',
      type: 'concert',
      price: 0,
      imageUrl: '',
      type: 'other',
      featured: false,
      capacity: 50,
      includesAccommodation: false,
      includesTransport: false,
      includesMeals: false,
      maxAttendees: 100
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, type } = e.target as HTMLInputElement & { name: keyof EventFormData };
    
    setCurrentEvent(prev => ({
      ...prev,
      [name]: type === 'number' 
        ? Number(value)
        : type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && 'id' in currentEvent && currentEvent.id) {
        // Update existing event
        const updatedEvent = await eventService.updateEvent(
          currentEvent.id, 
          currentEvent as Omit<EventType, 'id' | 'createdAt' | 'updatedAt'>
        );
        setEvents(prevEvents => 
          prevEvents.map(event => event.id === currentEvent.id ? updatedEvent : event)
        );
        setSnackbar({ open: true, message: 'Event updated successfully', severity: 'success' });
      } else {
        // Create new event
        const newEvent = await eventService.createEvent(
          currentEvent as Omit<EventType, 'id' | 'createdAt' | 'updatedAt'>
        );
        setEvents(prevEvents => [...prevEvents, newEvent]);
        setSnackbar({ open: true, message: 'Event created successfully', severity: 'success' });
      }
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } 
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventService.deleteEvent(id);
        setEvents(events.filter(event => event.id !== id));
        showSnackbar('Event deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting event:', error);
        showSnackbar('Failed to delete event. Please try again.', 'error');
      }
    }
  };

  const getEventTypeLabel = (type: string) => {
    const found = eventTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
        <Typography variant="h4">Manage Events & Itineraries</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add New Event
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Event</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Inclusions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.length > 0 ? (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {event.imageUrl && (
                        <Box
                          component="img"
                          src={event.imageUrl}
                          alt={event.title}
                          sx={{
                            width: 60,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mr: 2
                          }}
                        />
                      )}
                      <Box>
                        <Typography fontWeight="bold">{event.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          <EventIcon />{event.description.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getEventTypeLabel(event.type)}
                      size="small"
                      sx={{ 
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText'
                      }}
                    />
                    {event.featured && (
                      <Chip 
                        label="Featured"
                        size="small"
                        color="secondary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(event.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>${event.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {event.includesAccommodation && <Hotel color="primary" />}
                      {event.includesTransport && <DirectionsCar color="primary" />}
                      {event.includesMeals && <Restaurant color="primary" />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleOpen(event)}
                      aria-label="edit"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(event.id!)}
                      aria-label="delete"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">
                    No events found. Create your first event!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogContent>
            <Box mt={2} display="grid" gap={3} gridTemplateColumns="1fr 1fr">
              <TextField
                label="Title"
                name="title"
                value={currentEvent.title || ''}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Event Type</InputLabel>
                <Select
                  name="type"
                  value={currentEvent.type || 'gala'}
                  onChange={handleChange}
                  label="Event Type"
                >
                  {eventTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Date"
                name="date"
                type="date"
                value={currentEvent.date || ''}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="Location"
                name="location"
                value={currentEvent.location || ''}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Price"
                name="price"
                type="number"
                value={currentEvent.price || ''}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                label="Max Attendees"
                name="maxAttendees"
                type="number"
                value={currentEvent.maxAttendees || ''}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Image URL"
                name="imageUrl"
                value={currentEvent.imageUrl || ''}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <Box gridColumn="1 / -1">
                <TextField
                  label="Description"
                  name="description"
                  value={currentEvent.description || ''}
                  onChange={handleChange}
                  fullWidth
                  required
                  margin="normal"
                  multiline
                  rows={4}
                />
              </Box>
              <Box gridColumn="1 / -1">
                <Typography variant="subtitle2" gutterBottom>
                  Inclusions
                </Typography>
                <Box display="flex" gap={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="includesAccommodation"
                        checked={!!currentEvent.includesAccommodation}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Accommodation"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="includesTransport"
                        checked={!!currentEvent.includesTransport}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Transport"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="includesMeals"
                        checked={!!currentEvent.includesMeals}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Meals"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="featured"
                        checked={currentEvent.featured}
                        onChange={handleCheckboxChange}
                      />
                    }
                    label="Featured Event"
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="inherit">
              Cancel
            </Button>
            <Button type="submit" color="primary" variant="contained">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EventsManagement;
