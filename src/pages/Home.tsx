import React from 'react';
import { Container, Typography, Box, Button, Card, CardContent, CardMedia } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const featuredTours = [
    {
      id: 1,
      title: 'South Coast Adventure',
      description: "Explore the stunning beaches and hidden gems of Jamaica's south coast",
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

      {/* Featured Tours */}
      <Container maxWidth="lg" sx={{ my: 8 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Featured Tours
        </Typography>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 4,
          mt: 4
        }}>
          {featuredTours.map((tour) => (
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
                <Typography variant="h6" component="h3" gutterBottom>
                  {tour.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {tour.description}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate(`/tours/${tour.id}`)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
