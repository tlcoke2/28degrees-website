import React, { useState } from 'react';
import { 
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, Select, MenuItem, FormControl, 
  InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Paper, FormControlLabel, Checkbox
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Event, EventCategory } from '../../types/event';

// Define a type for the form data
type EventFormData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;

// Custom GridItem component to handle the 'item' prop correctly
const GridItem = ({ children, ...props }: any) => (
  <Grid item {...props}>
    {children}
  </Grid>
);

const EventsManagement: React.FC = () => {
  const [events] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<EventFormData>>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    price: 0,
    capacity: 50,
    featured: false,
    category: 'general',
    type: 'other',
    imageUrl: ''
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
    SelectChangeEvent<string | number | boolean>
  ) => {
    const { name, value } = e.target as { name: string; value: unknown };
    setCurrentEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', currentEvent);
    setOpen(false);
  };

  // Handle delete event
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      console.log('Delete event:', id);
    }
  };

  // Handle edit event
  const handleEdit = (event: Event) => {
    setCurrentEvent(event);
    setIsEditing(true);
    setOpen(true);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <h2>Events Management</h2>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentEvent({
              title: '',
              description: '',
              date: '',
              time: '',
              location: '',
              price: 0,
              capacity: 50,
              featured: false,
              category: 'general'
            });
            setIsEditing(false);
            setOpen(true);
          }}
        >
          Add Event
        </Button>
      </Box>

      {/* Events Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.length > 0 ? (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{event.date} {event.time || ''}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>${event.price}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(event)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => event.id && handleDelete(event.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No events found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Event Dialog */}
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
                  value={currentEvent.title || ''}
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
                  value={currentEvent.date || ''}
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
                  label="Time"
                  name="time"
                  type="time"
                  value={currentEvent.time || ''}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </GridItem>
              
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={currentEvent.location || ''}
                  onChange={handleChange}
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
                  value={currentEvent.price || 0}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  name="capacity"
                  type="number"
                  value={currentEvent.capacity || 50}
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
                  <InputLabel id="event-category-label">Category</InputLabel>
                  <Select
                    labelId="event-category-label"
                    name="category"
                    value={currentEvent.category || 'general' as EventCategory}
                    onChange={handleChange}
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
              
              <GridItem xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="featured"
                      checked={!!currentEvent.featured}
                      onChange={(e) =>
                        setCurrentEvent(prev => ({
                          ...prev,
                          featured: e.target.checked
                        }))
                      }
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
                  value={currentEvent.description || ''}
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
