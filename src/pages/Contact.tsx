import React, { useState } from 'react';
import { Container, Typography, Box, TextField, Button, Alert, Card, CardContent } from '@mui/material';
import { Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon } from '@mui/icons-material';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      // TODO: Implement actual contact form submission logic (e.g., API call)
      setSuccessMessage('Thank you for your message! We will get back to you soon.');
      setErrorMessage('');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setErrorMessage('Error submitting message. Please try again.');
      setSuccessMessage('');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center">
          Contact Us
        </Typography>
        <Typography variant="h5" color="text.secondary" align="center" sx={{ mb: 6 }}>
          We'd love to hear from you
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6 }}>
          <Box>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Get in Touch
                </Typography>
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      multiline
                      rows={4}
                      required
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                    >
                      Send Message
                    </Button>
                    {successMessage && (
                      <Alert severity="success">{successMessage}</Alert>
                    )}
                    {errorMessage && (
                      <Alert severity="error">{errorMessage}</Alert>
                    )}
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" component="h3" gutterBottom>
                  Contact Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationIcon color="primary" sx={{ mr: 2 }} />
                  <Typography>123 Beach Road, Negril, Jamaica</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneIcon color="primary" sx={{ mr: 2 }} />
                  <Typography>+44 7398076328</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailIcon color="primary" sx={{ mr: 2 }} />
                  <Typography>info@28degreeswest.com</Typography>
                </Box>
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Business Hours
                  </Typography>
                  <Typography>Monday - Friday: 9:00 AM - 6:00 PM</Typography>
                  <Typography>Saturday: 10:00 AM - 4:00 PM</Typography>
                  <Typography>Sunday: Closed</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Contact;
