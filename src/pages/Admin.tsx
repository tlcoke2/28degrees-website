import React, { useState } from 'react';
import {
  Container, Typography, Box, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Alert, Paper, IconButton
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';
import { Add, Close } from '@mui/icons-material';
import axios from 'axios';

// Types
interface TourFormData {
  title: string;
  description: string;
  duration: string;
  price: number;
  features: string[];
  image: File | null;
}

const Admin: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TourFormData>({
    title: '',
    description: '',
    duration: '',
    price: 0,
    features: [],
    image: null,
  });

  const [featureInput, setFeatureInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Text inputs
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }));
  };

  // Select (MUI)
  const handleDurationChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({
      ...prev,
      duration: event.target.value as string,
    }));
  };

  // Features add/remove
  const handleFeatureAdd = () => {
    if (featureInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const handleFeatureRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // Image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFormData((prev) => ({ ...prev, image: f }));
  };

  // Submit
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('duration', formData.duration);
    data.append('price', String(formData.price));
    formData.features.forEach((f, i) => data.append(`features[${i}]`, f));
    if (formData.image) data.append('image', formData.image);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/tours`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            // Authorization: `Bearer ${adminToken}`,
          },
          withCredentials: true,
        }
      );

      setSuccessMessage('Tour successfully created!');
      setErrorMessage('');
      setFormData({
        title: '',
        description: '',
        duration: '',
        price: 0,
        features: [],
        image: null,
      });
    } catch (error) {
      setErrorMessage('Error creating tour. Please try again.');
      setSuccessMessage('');
    }
  };

  const durationLabelId = 'duration-label';
  const durationSelectId = 'duration-select';

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Admin Dashboard
          </Typography>

          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
          {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

          <Typography variant="h6" gutterBottom>
            Create New Tour
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                fullWidth
                label="Tour Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />

              <FormControl fullWidth required>
                <InputLabel id={durationLabelId}>Duration</InputLabel>
                <Select
                  labelId={durationLabelId}
                  id={durationSelectId}
                  name="duration"
                  label="Duration"
                  value={formData.duration}
                  onChange={handleDurationChange}
                >
                  <MenuItem value="">
                    <em>Select Duration</em>
                  </MenuItem>
                  <MenuItem value="Half Day">Half Day</MenuItem>
                  <MenuItem value="Full Day">Full Day</MenuItem>
                  <MenuItem value="Multi-Day">Multi-Day</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                inputProps={{ step: '0.01', min: 0 }}
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
              />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Features
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                  <TextField
                    fullWidth
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="Add feature"
                  />
                  <IconButton onClick={handleFeatureAdd} color="primary" aria-label="add-feature">
                    <Add />
                  </IconButton>
                </Box>

                <Box display="flex" flexDirection="column" gap={1}>
                  {formData.features.map((feature, index) => (
                    <Box
                      key={`${feature}-${index}`}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}
                    >
                      <Typography>{feature}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleFeatureRemove(index)}
                        aria-label={`remove-feature-${index}`}
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Button variant="outlined" component="label">
                Upload Tour Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>

              <Button variant="contained" type="submit" color="primary">
                Submit Tour
              </Button>
              <Button variant="text" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Admin;




