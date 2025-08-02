import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Box, 
  Button, 
  Grid, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormControlLabel, 
  Checkbox,
  Divider,
  Alert,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import { 
  Payment as PaymentIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/UserContext';

// Mock function to simulate API call for event details
const fetchEventDetails = async (eventId: string) => {
  // In a real app, this would be an API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock event data - in a real app, this would come from your backend
  const mockEvents = [
    {
      id: '1',
      title: 'Summer Music Festival',
      description: 'Annual summer music festival featuring top artists from around the world.',
      date: '2023-08-15',
      time: '18:00',
      location: 'Central Park, New York',
      price: 99.99,
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    },
    {
      id: '2',
      title: 'Premier League: City vs United',
      description: 'Exciting football match between two top teams in the Premier League.',
      date: '2023-08-20',
      time: '20:00',
      location: 'Etihad Stadium, Manchester',
      price: 149.99,
      image: 'https://images.unsplash.com/photo-1579952363872-3f2a6f5a08b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    },
    {
      id: '3',
      title: 'Broadway Show: Hamilton',
      description: 'Award-winning musical about the life of Alexander Hamilton.',
      date: '2023-09-05',
      time: '19:30',
      location: 'Richard Rodgers Theatre, New York',
      price: 199.99,
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    },
  ];
  
  return mockEvents.find(event => event.id === eventId) || null;
};

const steps = ['Event Details', 'Your Information', 'Payment', 'Confirmation'];

export const BookEvent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [activeStep, setActiveStep] = useState(0);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    paymentMethod: 'credit-card',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    termsAccepted: false,
    tickets: 1,
    installments: 1
  });

  // Fetch event details
  useEffect(() => {
    const getEventDetails = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        const eventData = await fetchEventDetails(eventId);
        if (!eventData) {
          setError('Event not found');
          return;
        }
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    getEventDetails();
  }, [eventId]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | 
    SelectChangeEvent<string | number>
  ) => {
    const target = e.target as HTMLInputElement;
    const name = target.name;
    const type = target.type;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // Handle both string and number values from Select components
    const value = 'value' in e.target 
      ? e.target.value 
      : (e.target as HTMLInputElement).value;
    
    // Convert to number if the field expects a number
    const processedValue = (name === 'installments' || name === 'tickets')
      ? Number(value)
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeStep === steps.length - 2) {
      // Simulate payment processing
      try {
        setLoading(true);
        // In a real app, this would call your payment API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate a mock booking ID
        const mockBookingId = 'BK' + Math.random().toString(36).substr(2, 8).toUpperCase();
        setBookingId(mockBookingId);
        handleNext();
      } catch (err) {
        console.error('Payment failed:', err);
        setError('Payment processing failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      handleNext();
    }
  };

  const calculateTotal = (): string => {
    if (!event) return '0.00';
    return (event.price * formData.tickets).toFixed(2);
  };

  const calculateInstallment = () => {
    const total = parseFloat(calculateTotal());
    return (total / formData.installments).toFixed(2);
  };

  if (loading && !event) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Event not found or no event selected.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Container>
    );
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardMedia
                  component="img"
                  height="300"
                  image={event.image}
                  alt={event.title}
                />
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {event.title}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {event.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimeIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {event.time}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Price per ticket:</Typography>
                    <Typography>${event.price.toFixed(2)}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Number of tickets:</Typography>
                    <TextField
                      type="number"
                      name="tickets"
                      value={formData.tickets}
                      onChange={handleChange}
                      size="small"
                      inputProps={{ min: 1, max: 10 }}
                      sx={{ width: 80 }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${calculateTotal()}
                    </Typography>
                  </Box>
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  onClick={handleNext}
                  startIcon={<PaymentIcon />}
                >
                  Continue to Payment
                </Button>
              </Paper>
              
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Need help?
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Contact our customer support for any questions about this event.
                </Typography>
                <Button variant="outlined" size="small" startIcon={<PhoneIcon />}>
                  +1 (555) 123-4567
                </Button>
              </Paper>
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="First name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Last name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      margin="normal"
                      InputProps={{
                        startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Payment Method
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="payment-method-label">Payment Method</InputLabel>
                  <Select
                    labelId="payment-method-label"
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    label="Payment Method"
                    onChange={handleChange}
                  >
                    <MenuItem value="credit-card">
                      <CreditCardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Credit/Debit Card
                    </MenuItem>
                    <MenuItem value="bank-transfer">
                      <BankIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Bank Transfer
                    </MenuItem>
                  </Select>
                </FormControl>
                
                {formData.paymentMethod === 'credit-card' && (
                  <>
                    <TextField
                      required
                      fullWidth
                      label="Card number"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      margin="normal"
                      placeholder="1234 5678 9012 3456"
                      InputProps={{
                        startAdornment: <CreditCardIcon color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          label="Expiry date"
                          name="cardExpiry"
                          value={formData.cardExpiry}
                          onChange={handleChange}
                          margin="normal"
                          placeholder="MM/YY"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          required
                          fullWidth
                          label="CVC"
                          name="cardCvc"
                          value={formData.cardCvc}
                          onChange={handleChange}
                          margin="normal"
                          placeholder="123"
                        />
                      </Grid>
                    </Grid>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="installments-label">Installments</InputLabel>
                      <Select
                        labelId="installments-label"
                        id="installments"
                        name="installments"
                        value={formData.installments}
                        label="Installments"
                        onChange={handleChange}
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <MenuItem key={num} value={num}>
                            {num === 1 ? 'Full Payment' : `${num}x $${calculateInstallment()}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
                
                <FormControlLabel
                  control={
                    <Checkbox 
                      color="primary" 
                      name="termsAccepted" 
                      checked={formData.termsAccepted as boolean}
                      onChange={handleChange}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the Terms & Conditions and Privacy Policy
                    </Typography>
                  }
                  sx={{ mt: 2, display: 'block' }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!formData.termsAccepted || loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Complete Booking'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        );
        
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Processing Your Payment
            </Typography>
            <Typography color="text.secondary" paragraph>
              Please wait while we process your payment. This may take a few moments.
            </Typography>
          </Box>
        );
        
      case 3:
        return (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Box sx={{ color: 'success.main', mb: 3 }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
                </svg>
              </Box>
              
              <Typography variant="h4" component="h1" gutterBottom>
                Booking Confirmed!
              </Typography>
              
              <Typography variant="subtitle1" color="text.secondary" paragraph>
                Thank you for your booking, {formData.firstName}!
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 3, my: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  BOOKING REFERENCE
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {bookingId}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  {event.title}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {event.time}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <LocationIcon color="action" fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
                      <Typography variant="body2">
                        {event.location}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tickets:</Typography>
                  <Typography>{formData.tickets} x ${event.price.toFixed(2)}</Typography>
                </Box>
                
                {formData.installments > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Installments:</Typography>
                    <Typography>{formData.installments}x ${calculateInstallment()}</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px dashed #e0e0e0' }}>
                  <Typography variant="subtitle1">Total:</Typography>
                  <Typography variant="h6">${calculateTotal()}</Typography>
                </Box>
              </Paper>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                A confirmation email has been sent to {formData.email}
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ mt: 2, mb: 3 }}
                onClick={() => navigate('/dashboard')}
              >
                View My Bookings
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                Need help? Contact our support team at support@28degreeswest.com
              </Typography>
            </Box>
          </Paper>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, display: { xs: 'none', sm: 'flex' } }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Box sx={{ mt: 2, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {renderStepContent(activeStep)}
      </Box>
    </Container>
  );
};

export default BookEvent;
