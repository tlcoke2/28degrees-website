import React, { useState } from 'react';
import { Container, Typography, Box, Button, TextField, Alert, Paper } from '@mui/material';
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

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

        <Paper 
          component="form"
          onSubmit={handleFormSubmit}
          elevation={3} 
          sx={{ p: 4, maxWidth: 600, mx: 'auto' }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Tour Details
          </Typography>
          
          <Box component="div" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
            
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              required
            />
            
            <TextField
              fullWidth
              type="tel"
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
            
            <TextField
              fullWidth
              type="date"
              label="Preferred Date"
              name="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              label="Number of People"
              name="numberOfPeople"
              type="number"
              value={formData.numberOfPeople}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData(prev => ({
                  ...prev,
                  numberOfPeople: isNaN(value) ? 1 : Math.max(1, value)
                }));
              }}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Special Requests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3 }}
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
