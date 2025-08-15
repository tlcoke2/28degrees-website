import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { tourService } from '../../services/api';
import type { Tour as ApiTour } from '../../types/tour';

// ---- Form type: omit server-managed fields and make everything present for the form
type TourFormData = Omit<ApiTour, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string; // used only when editing
};

// ---- Small helper for Grid item ----
const GridItem: React.FC<React.ComponentProps<typeof Grid>> = ({ children, ...props }) => (
  <Grid item {...props}>{children}</Grid>
);

// ---- Default form state for a new tour ----
const defaultTour: TourFormData = {
  title: '',
  description: '',
  duration: '',           // keep as string if that’s your UI type
  location: '',
  price: 0,
  capacity: 10,
  difficulty: 'easy' as any,
  featured: false,
  category: 'adventure' as any,
  imageUrl: '',
  type: 'tour' as any,
  maxAttendees: 10
};

const ToursManagement: React.FC = () => {
  // Full list (we’ll paginate client-side)
  const [allTours, setAllTours] = useState<ApiTour[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Dialog + form state
  const [open, setOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentTour, setCurrentTour] = useState<TourFormData>(defaultTour);

  // Pagination (client-side)
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  const showSnack = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ------- Fetch all tours -------
  const fetchTours = useCallback(async () => {
    setLoading(true);
    try {
      const tours = await tourService.getAllTours(); // returns ApiTour[]
      setAllTours(tours || []);
    } catch (err: any) {
      showSnack(err?.message || 'Failed to load tours', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  // ------- Slice for client-side pagination -------
  const pagedTours = useMemo(() => {
    const start = page * rowsPerPage;
    return allTours.slice(start, start + rowsPerPage);
  }, [allTours, page, rowsPerPage]);

  // ------- Input handlers -------
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // numeric fields
    if (['price', 'capacity', 'maxAttendees'].includes(name)) {
      setCurrentTour(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setCurrentTour(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target as { name: string; value: unknown };
    setCurrentTour(prev => ({ ...prev, [name]: value as any }));
  };

  const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTour(prev => ({ ...prev, featured: e.target.checked }));
  };

  // ------- Create / Edit -------
  const openCreate = () => {
    setCurrentTour(defaultTour);
    setIsEditing(false);
    setOpen(true);
  };

  const openEdit = (tour: ApiTour) => {
    const { id, createdAt, updatedAt, ...rest } = tour as any;
    setCurrentTour({ ...defaultTour, ...rest, id });
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && currentTour.id) {
        const { id, ...updateData } = currentTour;
        await tourService.updateTour(id, updateData as any);
        showSnack('Tour updated successfully');
      } else {
        const { id, ...createData } = currentTour;
        await tourService.createTour(createData as any);
        showSnack('Tour created successfully');
      }
      setOpen(false);
      await fetchTours();
    } catch (err: any) {
      showSnack(err?.message || 'Failed to save tour', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ------- Delete -------
  const handleDelete = async (id: string) => {
    const ok = window.confirm('Are you sure you want to delete this tour?');
    if (!ok) return;

    setSaving(true);
    try {
      await tourService.deleteTour(id);
      showSnack('Tour deleted successfully');
      await fetchTours();
    } catch (err: any) {
      showSnack(err?.message || 'Failed to delete tour', 'error');
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
        <Typography variant="h5">Tours Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Add Tour
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Featured</TableCell>
                <TableCell width={140} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : pagedTours.length > 0 ? (
                pagedTours.map(tour => (
                  <TableRow key={tour.id}>
                    <TableCell>{tour.title}</TableCell>
                    <TableCell>{tour.duration}</TableCell>
                    <TableCell>{tour.location}</TableCell>
                    <TableCell align="right">
                      {typeof tour.price === 'number' ? `$${tour.price.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>{(tour as any).difficulty || '-'}</TableCell>
                    <TableCell>{(tour as any).category || '-'}</TableCell>
                    <TableCell align="center">{tour.featured ? 'Yes' : 'No'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => openEdit(tour)} aria-label="Edit tour">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => tour.id && handleDelete(tour.id)}
                        aria-label="Delete tour"
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No tours found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={allTours.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Add/Edit Dialog */}
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
                  value={currentTour.title}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Duration"
                  name="duration"
                  value={currentTour.duration}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={currentTour.location}
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
                  value={currentTour.price}
                  onChange={handleTextChange}
                  required
                  margin="normal"
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </GridItem>

              <GridItem xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tour-difficulty-label">Difficulty</InputLabel>
                  <Select
                    labelId="tour-difficulty-label"
                    name="difficulty"
                    value={(currentTour.difficulty as any) || 'easy'}
                    onChange={handleSelectChange}
                    label="Difficulty"
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tour-category-label">Category</InputLabel>
                  <Select
                    labelId="tour-category-label"
                    name="category"
                    value={(currentTour.category as any) || 'adventure'}
                    onChange={handleSelectChange}
                    label="Category"
                  >
                    <MenuItem value="adventure">Adventure</MenuItem>
                    <MenuItem value="cultural">Cultural</MenuItem>
                    <MenuItem value="culinary">Culinary</MenuItem>
                    <MenuItem value="nature">Nature</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tour-type-label">Type</InputLabel>
                  <Select
                    labelId="tour-type-label"
                    name="type"
                    value={(currentTour.type as any) || 'tour'}
                    onChange={handleSelectChange}
                    label="Type"
                  >
                    <MenuItem value="tour">Tour</MenuItem>
                    <MenuItem value="experience">Experience</MenuItem>
                    <MenuItem value="package">Package</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>

              <GridItem xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Attendees"
                  name="maxAttendees"
                  type="number"
                  value={currentTour.maxAttendees ?? 10}
                  onChange={handleTextChange}
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </GridItem>

              <GridItem xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="featured"
                      checked={!!currentTour.featured}
                      onChange={handleFeaturedChange}
                    />
                  }
                  label="Featured Tour"
                />
              </GridItem>

              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Image URL"
                  name="imageUrl"
                  value={currentTour.imageUrl || ''}
                  onChange={handleTextChange}
                  margin="normal"
                />
              </GridItem>

              <GridItem xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={currentTour.description || ''}
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

