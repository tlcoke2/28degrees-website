import React from 'react';
import { Container, Typography, Box, Button, Card, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Tours: React.FC = () => {
  const navigate = useNavigate();

  const tours = [
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
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ my: 8 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Our Tours & Experiences
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 6 }}>
          Discover the best of Jamaica's South Coast with our curated selection of tours
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
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => navigate(`/bookings/${tour.id}`)}
                  sx={{ mt: 'auto' }}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Tours;
