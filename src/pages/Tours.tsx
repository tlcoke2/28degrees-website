import React from 'react';
import { Container, Grid, Paper, Typography, Box, Button, Card, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Tours: React.FC = () => {
  const navigate = useNavigate();

  const tours = [
    {
      id: 1,
      title: 'South Coast Adventure',
      description: 'Explore the stunning beaches and hidden gems of Jamaica's south coast',
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
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center">
          Our Tours
        </Typography>
        <Typography variant="h5" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Experience the beauty and culture of Jamaica's south coast
        </Typography>

        <Grid container spacing={4}>
          {tours.map((tour) => (
            <Grid item xs={12} md={4} key={tour.id}>
              <Card sx={{ height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={tour.image}
                  alt={tour.title}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {tour.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {tour.description}
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                    ${tour.price} per person
                  </Typography>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Duration: {tour.duration}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {tour.features.map((feature, index) => (
                      <Typography key={index} variant="body2" color="text.secondary">
                        {feature}
                      </Typography>
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/tours/${tour.id}`)}
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Tours;
