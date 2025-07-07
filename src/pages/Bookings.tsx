import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Alert } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

interface BookingFormData {
  tourId: string;
  fullName: string;
  email: string;
  phone: string;
  date: string;
  numberOfPeople: number;
  specialRequests: string;
}

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState<BookingFormData>({
    tourId: id || '',
    fullName: '',
    email: '',
    phone: '',
    date: '',
    numberOfPeople: 1,
    specialRequests: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      // TODO: Implement actual booking logic (e.g., API call)
      setSuccessMessage('Booking successfully submitted! We will contact you shortly.');
      setErrorMessage('');
      setFormData({
        tourId: id || '',
        fullName: '',
        email: '',
        phone: '',
        date: '',
        numberOfPeople: 1,
        specialRequests: '',
      });
    } catch (error) {
      setErrorMessage('Error submitting booking. Please try again.');
      setSuccessMessage('');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center">
          Book Your Tour
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

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom>
            Tour Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
            
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            
            <TextField
              fullWidth
              type="tel"
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
            
            <TextField
              fullWidth
              type="date"
              label="Preferred Date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            
            <FormControl fullWidth>
              <InputLabel>Number of People</InputLabel>
              <Select
                name="numberOfPeople"
                value={formData.numberOfPeople}
                onChange={handleInputChange}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <MenuItem key={num} value={num}>
                    {num} person{num > 1 ? 's' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Special Requests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleInputChange}
            />
            
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Submit Booking
            </Button>
          </Box>
        </Paper>

        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/tours')} 
          sx={{ mt: 2 }}
        >
          Back to Tours
        </Button>
      </Container>
    </Box>
  );
};

export default Bookings;
