import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, 
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Snackbar, Alert
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { tourService } from '../../services/api';
import { Tour } from '../../types/tour';

const ToursManagement: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [open, setOpen] = useState(false);
  const [currentTour, setCurrentTour] = useState<Partial<Tour>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { isAdmin } = useAuth();

  // Load tours from API
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const data = await tourService.getAllTours();
        setTours(data);
      } catch (error) {
        console.error('Error fetching tours:', error);
        setError('Failed to load tours. Please try again later.');
        setSnackbar({ open: true, message: 'Failed to load tours', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const handleOpen = (tour?: Tour) => {
    if (tour) {
      setCurrentTour(tour);
      setIsEditing(true);
    } else {
      setCurrentTour({
        title: '',
        description: '',
        duration: '',
        price: 0,
        imageUrl: '',
        type: 'cultural',
        featured: false
      });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentTour({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setCurrentTour(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentTour.id) {
        const updatedTour = await tourService.updateTour(currentTour.id, currentTour);
        setTours(tours.map(t => t.id === currentTour.id ? updatedTour : t));
        setSnackbar({ open: true, message: 'Tour updated successfully', severity: 'success' });
      } else {
        const newTour = await tourService.createTour(currentTour);
        setTours([...tours, newTour]);
        setSnackbar({ open: true, message: 'Tour created successfully', severity: 'success' });
      }
      handleClose();
    } catch (error) {
      console.error('Error saving tour:', error);
      setSnackbar({ open: true, message: 'Failed to save tour', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tour?')) {
      try {
        await tourService.deleteTour(id);
        setTours(tours.filter(tour => tour.id !== id));
        setSnackbar({ open: true, message: 'Tour deleted successfully', severity: 'success' });
      } catch (error) {
        console.error('Error deleting tour:', error);
        setSnackbar({ open: true, message: 'Failed to delete tour', severity: 'error' });
      }
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Manage Tours</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add New Tour
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Featured</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tours.map((tour) => (
              <TableRow key={tour.id}>
                <TableCell>{tour.title}</TableCell>
                <TableCell>{tour.type}</TableCell>
                <TableCell>{tour.duration}</TableCell>
                <TableCell>${tour.price}</TableCell>
                <TableCell>{tour.featured ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(tour)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(tour.id!)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Tour Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Tour' : 'Add New Tour'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              name="title"
              label="Tour Title"
              type="text"
              fullWidth
              value={currentTour.title || ''}
              onChange={handleChange}
              required
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={currentTour.description || ''}
              onChange={handleChange}
              required
            />
            <Box display="flex" gap={2} my={2}>
              <TextField
                margin="dense"
                name="duration"
                label="Duration"
                type="text"
                fullWidth
                value={currentTour.duration || ''}
                onChange={handleChange}
                required
              />
              <TextField
                margin="dense"
                name="price"
                label="Price"
                type="number"
                fullWidth
                value={currentTour.price || ''}
                onChange={handleChange}
                required
              />
            </Box>
            <Box display="flex" gap={2} my={2}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={currentTour.type || 'cultural'}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="adventure">Adventure</MenuItem>
                  <MenuItem value="cultural">Cultural</MenuItem>
                  <MenuItem value="relaxation">Relaxation</MenuItem>
                  <MenuItem value="luxury">Luxury</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Featured</InputLabel>
                <Select
                  name="featured"
                  value={currentTour.featured ? 'yes' : 'no'}
                  onChange={(e) => 
                    setCurrentTour({...currentTour, featured: e.target.value === 'yes'})
                  }
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              margin="dense"
              name="imageUrl"
              label="Image URL"
              type="url"
              fullWidth
              value={currentTour.imageUrl || ''}
              onChange={handleChange}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary" variant="contained">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity as 'success' | 'error'}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ToursManagement;
