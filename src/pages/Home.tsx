import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CardActions,
  Rating,
  styled
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Import Grid2 for better TypeScript support
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

// Hero image
const heroImage = '/images/hero-bg.jpg';

interface Tour {
  id: number;
  title: string;
  description: string;
  image: string;
  location: string;
  price: number;
  duration: string;
  rating: number;
}

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 345,
  margin: '0 auto',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[10],
  },
}));

const Home: React.FC = () => {
  const navigate = useNavigate();

  const featuredTours: Tour[] = [
    {
      id: 1,
      title: 'Luxury Beach Getaway',
      description: 'Experience the finest beaches in Jamaica with our exclusive VIP beach package.',
      image: '/images/beach.jpg',
      location: 'Negril',
      price: 299,
      duration: '3 days',
      rating: 4.8
    },
    {
      id: 2,
      title: 'Mountain Retreat',
      description: 'Discover the breathtaking mountain views of Jamaica in ultimate comfort.',
      image: '/images/mountain.jpg',
      location: 'Blue Mountains',
      price: 399,
      duration: '5 days',
      rating: 4.9
    },
    {
      id: 3,
      title: 'Cultural Heritage Tour',
      description: 'Immerse yourself in the rich culture and history of Jamaica.',
      image: '/images/culture.jpg',
      location: 'Kingston',
      price: 249,
      duration: '2 days',
      rating: 4.7
    }
  ];

  const handleTourSelect = (tourId: number) => {
    navigate(`/tours/${tourId}`);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          textAlign: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 700,
              mb: 3,
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            Discover Jamaica's Hidden Gems
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{
              mb: 4,
              maxWidth: '700px',
              mx: 'auto',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            Experience luxury, adventure, and culture like never before with our exclusive adventures and experiences.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/tours')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              borderRadius: '50px',
              textTransform: 'none',
              fontWeight: 600,
              mb: 2,
              mr: 2,
            }}
          >
            Explore Experience
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            size="large"
            onClick={() => navigate('/contact')}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              borderRadius: '50px',
              textTransform: 'none',
              fontWeight: 600,
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Contact Us
          </Button>
        </Container>

        {/* Scroll indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            textAlign: 'center',
            opacity: 0.7,
            '&:hover': {
              opacity: 1,
              cursor: 'pointer',
            },
          }}
          onClick={() => {
            window.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth',
            });
          }}
        >
          <Typography variant="caption" display="block" sx={{ mb: 1, letterSpacing: 2 }}>
            SCROLL
          </Typography>
          <Box
            sx={{
              width: '24px',
              height: '40px',
              border: '2px solid white',
              borderRadius: '12px',
              position: 'relative',
              margin: '0 auto',
              '&:before': {
                content: '""',
                position: 'absolute',
                width: '4px',
                height: '8px',
                background: 'white',
                left: '50%',
                top: '8px',
                transform: 'translateX(-50%)',
                borderRadius: '2px',
                animation: 'scroll 2s infinite',
                '@keyframes scroll': {
                  '0%': {
                    transform: 'translate(-50%, 0)',
                    opacity: 1,
                  },
                  '100%': {
                    transform: 'translate(-50%, 20px)',
                    opacity: 0,
                  },
                },
              },
            }}
          />
        </Box>
      </Box>

      {/* Featured Tours Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" sx={{ mb: 6, fontWeight: 600 }}>
          Featured Experience
        </Typography>
        <Grid container spacing={4}>
          {featuredTours.map((tour) => (
            <Grid xs={12} sm={6} md={4} key={tour.id}>
              <StyledCard>
                <CardActionArea>
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: '60px' }}>
                      {tour.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOnIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {tour.location}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTimeIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {tour.duration}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MonetizationOnIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="h6" color="primary">
                        ${tour.price} USD
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating value={tour.rating} precision={0.1} readOnly />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {tour.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() => handleTourSelect(tour.id)}
                    fullWidth
                    sx={{ mx: 2 }}
                  >
                    Learn More
                  </Button>
                </CardActions>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
