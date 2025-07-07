import React from 'react';
import { Container, Grid, Paper, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const featuredTours = [
    {
      id: 1,
      title: 'South Coast Adventure',
      description: 'Explore the stunning beaches and hidden gems of Jamaica's south coast',
      image: '/assets/images/south-coast-adventure.jpg',
    },
    {
      id: 2,
      title: 'Waterfall Experience',
      description: 'Discover the breathtaking waterfalls of Jamaica',
      image: '/assets/images/waterfall-experience.jpg',
    },
    {
      id: 3,
      title: 'Cultural Tour',
      description: 'Immerse yourself in Jamaican culture and history',
      image: '/assets/images/cultural-tour.jpg',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Box
        sx={{
          height: '60vh',
          background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/assets/images/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Discover Jamaica's South Coast
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Unique Tours & Experiences
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate('/tours')}
        >
          View Tours
        </Button>
      </Box>

      {/* Featured Tours Section */}
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center">
          Featured Tours
        </Typography>
        <Grid container spacing={4}>
          {featuredTours.map((tour) => (
            <Grid item xs={12} sm={6} md={4} key={tour.id}>
              <Paper
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2,
                  textAlign: 'center',
                }}
              >
                <img
                  src={tour.image}
                  alt={tour.title}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    marginBottom: '1rem',
                  }}
                />
                <Typography variant="h5" component="h3">
                  {tour.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {tour.description}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/tours/${tour.id}`)}
                >
                  Learn More
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
