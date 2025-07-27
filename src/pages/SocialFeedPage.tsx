import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import SocialFeed from '../components/SocialFeed';

const SocialFeedPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          #28DegreesWest
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          maxWidth="700px"
          margin="0 auto"
        >
          Explore the latest from our community. Share your Jamaican adventures with #28DegreesWest
          for a chance to be featured!
        </Typography>
      </Box>
      
      <SocialFeed />
      
      <Box textAlign="center" mt={6}>
        <Typography variant="h6" gutterBottom>
          Want to see more?
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Follow us on social media for daily updates and inspiration
        </Typography>
      </Box>
    </Container>
  );
};

export default SocialFeedPage;
