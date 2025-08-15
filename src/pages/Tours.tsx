import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays } from 'date-fns';
import SocialShare from '../components/SocialShare';

interface Tour {
  id: number;
  title: string;
  description: string;
  image: string;
  duration: string;
  price: number;
  features: string[];
}

const Tours: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | null>(addDays(new Date(), 1));
  const [participants, setParticipants] = useState<number>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!bookingDate) newErrors.bookingDate = 'Please select a date';
    if (participants < 1) newErrors.participants = 'At least one participant is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBookNow = (tour: Tour) => {
    setSelectedTour(tour);
    setOpenBookingDialog(true);
  };

  const handleProceedToCheckout = () => {
    if (!validateForm() || !selectedTour) return;

    navigate('/checkout', {
      state: {
        amount: selectedTour.price * participants,
        description: `${selectedTour.title} (${participants} ${participants === 1 ? 'person' : 'people'})`,
        bookingDetails: {
          tourId: selectedTour.id,
          tourName: selectedTour.title,
          date: bookingDate?.toISOString(),
          participants,
          customerInfo: {
            name,
            email,
            phone,
          },
        },
      },
    });
  };

  const handleCloseDialog = () => {
    setOpenBookingDialog(false);
    setErrors({});
  };

  const tours: Tour[] = [
    {
      id: 1,
      title: 'South Coast Adventure',
      description: "Explore the stunning beaches and hidden gems of Jamaica's south coast",
      image: '/assets/images/south-coast-adventure.jpg',
      duration: 'Full Day',
      price: 199.99,
      features: [
        'Guided beach exploration',
        'Local cuisine tasting',
        'Historical site visits',
        'Photography stops',
      ],
    },
    {
      id: 2,
      title: 'Waterfall Experience',
      description: 'Discover the breathtaking waterfalls of Jamaica',
      image: '/assets/images/waterfall-experience.jpg',
      duration: 'Half Day',
      price: 149.99,
      features: [
        'Waterfall hikes',
        'Swimming opportunities',
        'Local guide',
        'Transportation included',
      ],
    },
    {
      id: 3,
      title: 'Cultural Tour',
      description: 'Immerse yourself in Jamaican culture and history',
      image: '/assets/images/cultural-tour.jpg',
      duration: 'Full Day',
      price: 179.99,
      features: [
        'Historical site visits',
        'Local market tour',
        'Cultural performances',
        'Traditional lunch',
      ],
    },
  ];

  return (
    <div>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Our Events & Experiences
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 6 }}>
          Discover the best of Jamaica's South Coast with our curated selection of events & experiences
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4,
        }}>
          {tours.map((tour) => (
            <Card key={tour.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="div"
                sx={{
                  pt: '56.25%', // 16:9 aspect ratio
                  backgroundSize: 'cover',
                  backgroundImage: `url(${tour.image})`,
                  backgroundPosition: 'center',
                }}
              />
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {tour.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {tour.description}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" color="primary">
                    Duration: {tour.duration}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${tour.price.toFixed(2)} per person
                  </Typography>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tour includes:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {tour.features.map((feature, index) => (
                      <li key={index}>
                        <Typography variant="body2" color="text.secondary">
                          {feature}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleBookNow(tour)}
                    sx={{ flex: 1 }}
                  >
                    Book Now
                  </Button>
                  <SocialShare
                    url={window.location.href}
                    title={`Check out ${tour.title} - 28 Degrees West`}
                    description={tour.description.substring(0, 100) + '...'}
                    variant="icon"
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      <Dialog open={openBookingDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Book {selectedTour?.title}</DialogTitle>
        <DialogContent>
          {selectedTour && (
            <Box mt={2}>
              <Box mb={3}>
                <DatePicker
                  label="Tour Date"
                  value={bookingDate}
                  onChange={(newValue) => setBookingDate(newValue)}
                  minDate={addDays(new Date(), 1)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      error: !!errors.bookingDate,
                      helperText: errors.bookingDate,
                      required: true
                    }
                  }}
                />
              </Box>

              <FormControl fullWidth margin="normal" error={!!errors.participants}>
                <InputLabel>Number of Participants</InputLabel>
                <Select
                  value={participants}
                  label="Number of Participants"
                  onChange={(e) => setParticipants(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <MenuItem key={num} value={num}>
                      {num} {num === 1 ? 'person' : 'people'}
                    </MenuItem>
                  ))}
                </Select>
                {errors.participants && (
                  <FormHelperText>{errors.participants}</FormHelperText>
                )}
              </FormControl>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Contact Information
              </Typography>

              <TextField
                label="Full Name"
                fullWidth
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />

              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email || 'We\'ll send your booking confirmation here'}
                required
              />

              <TextField
                label="Phone Number"
                type="tel"
                fullWidth
                margin="normal"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />

              <Box mt={3} p={2} bgcolor="action.hover" borderRadius={1}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Price per person:</Typography>
                  <Typography>${selectedTour.price.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Participants:</Typography>
                  <Typography>{participants}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    ${(selectedTour.price * participants).toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleProceedToCheckout}
            variant="contained"
            color="primary"
            size="large"
          >
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Tours;
