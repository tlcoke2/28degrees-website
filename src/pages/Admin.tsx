import React, { useState } from 'react';
import { Container, Typography, Box, Button, TextField, Select, MenuItem, FormControl, InputLabel, Alert, SelectChangeEvent, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

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
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { value } = event.target;
    if (value) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, value]
      }));
    }
  };

  const handleFeatureRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      // TODO: Implement actual form submission logic (e.g., API call)
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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" component="h2" gutterBottom align="center">
            Admin Dashboard
          </Typography>
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Typography variant="h5" component="h3" gutterBottom>
            Create New Tour
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              
              <FormControl fullWidth>
                <InputLabel>Duration</InputLabel>
                <Select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="">Select Duration</MenuItem>
                  <MenuItem value="Half Day">Half Day</MenuItem>
                  <MenuItem value="Full Day">Full Day</MenuItem>
                  <MenuItem value="Multi-Day">Multi-Day</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                type="number"
                label="Price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Features
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter a feature and press Enter"
                  onKeyDown={(e) => e.key === 'Enter' && handleFeatureChange(e as any)}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                  {formData.features.map((feature, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      <Typography>{feature}</Typography>
                      <Button
                        size="small"
                        onClick={() => handleFeatureRemove(index)}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                type="submit"
                sx={{ mt: 2 }}
              >
                Add Tour
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/')}
                sx={{ mt: 2, ml: 2 }}
              >
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
