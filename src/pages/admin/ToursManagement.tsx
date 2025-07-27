import React, { useState } from 'react';
import { 
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, 
  DialogTitle, Grid, TextField, Select, MenuItem, FormControl, 
  InputLabel, Checkbox, FormControlLabel
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Add as AddIcon } from '@mui/icons-material';
import { Tour } from '../../types/tour';

// Define a type for the form data
type TourFormData = Omit<Tour, 'id' | 'createdAt' | 'updatedAt'> & {
  includes?: string[];
};

// Custom GridItem component to handle the 'item' prop correctly
const GridItem = ({ children, ...props }: any) => (
  <Grid item {...props}>
    {children}
  </Grid>
);

const ToursManagement: React.FC = () => {
  // Tours state is commented out for future use
  // const [tours, setTours] = useState<Tour[]>([]);
  const [open, setOpen] = useState(false);
  const [currentTour, setCurrentTour] = useState<Partial<TourFormData>>({
    title: '',
    description: '',
    duration: '',
    location: '',
    price: 0,
    capacity: 10,
    difficulty: 'easy',
    featured: false,
    category: 'adventure',
    imageUrl: '',
    type: 'tour',
    maxAttendees: 10
  });
  const [isEditing] = useState(false); // setIsEditing is kept for future use
  const [loading] = useState(false); // setLoading is kept for future use
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | 
    SelectChangeEvent<string | number>
  ) => {
    const { name, value } = e.target as { name: string; value: unknown };
    setCurrentTour(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', currentTour);
    setOpen(false);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <h2>Tours Management</h2>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Tour
        </Button>
      </Box>

      {/* Add/Edit Tour Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{isEditing ? 'Edit Tour' : 'Add New Tour'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={currentTour.title || ''}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration"
                  name="duration"
                  value={currentTour.duration || ''}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
value={currentTour.location || ''}
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
                  value={currentTour.price || 0}
                  onChange={handleChange}
                  required
                  margin="normal"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tour-type-label">Tour Type</InputLabel>
                  <Select
                    labelId="tour-type-label"
                    name="type"
                    value={currentTour.type || 'adventure'}
                    onChange={handleChange}
                    label="Tour Type"
                    required
                  >
                    <MenuItem value="adventure">Adventure</MenuItem>
                    <MenuItem value="cultural">Cultural</MenuItem>
                    <MenuItem value="culinary">Culinary</MenuItem>
                    <MenuItem value="nature">Nature</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="featured"
                      checked={!!currentTour.featured}
                      onChange={(e) =>
                        setCurrentTour(prev => ({
                          ...prev,
                          featured: e.target.checked
                        }))
                      }
                    />
                  }
                  label="Featured Tour"
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
              {isEditing ? 'Update' : 'Create'} Tour
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

export default ToursManagement;
