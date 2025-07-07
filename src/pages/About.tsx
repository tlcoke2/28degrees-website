import React from 'react';
import { Container, Paper, Typography, Box, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';

const About: React.FC = () => {
  const teamMembers = [
    {
      name: 'John Smith',
      role: 'Founder & CEO',
      description: 'Passionate about sharing the beauty of Jamaica with the world',
      image: '/assets/images/team/john-smith.jpg',
    },
    {
      name: 'Sarah Johnson',
      role: 'Tour Guide',
      description: 'Local expert with extensive knowledge of Jamaican culture',
      image: '/assets/images/team/sarah-johnson.jpg',
    },
    {
      name: 'Michael Brown',
      role: 'Operations Manager',
      description: 'Ensures smooth operation of all tours and experiences',
      image: '/assets/images/team/michael-brown.jpg',
    },
  ];

  const testimonials = [
    {
      quote: "The South Coast Adventure tour was absolutely amazing! Our guide was incredibly knowledgeable and made the experience unforgettable.",
      author: "Emma Wilson",
      location: "London, UK",
    },
    {
      quote: "I can't recommend 28 Degrees West enough. Their attention to detail and commitment to customer satisfaction is second to none.",
      author: "James Chen",
      location: "Singapore",
    },
    {
      quote: "The Waterfall Experience tour was breathtaking. The natural beauty of Jamaica combined with excellent service made it a trip of a lifetime.",
      author: "Lisa Martinez",
      location: "Los Angeles, USA",
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h2" gutterBottom align="center">
          About Us
        </Typography>
        
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom>
            Our Story
          </Typography>
          <Typography paragraph>
            28 Degrees West is more than just a tour company - we're your gateway to experiencing the authentic beauty and culture of Jamaica's south coast. Founded by locals who are passionate about sharing their home with the world, we offer unique and memorable experiences that go beyond the typical tourist attractions.
          </Typography>
          <Typography paragraph>
            Our team of expert guides and local partners work together to create personalized tours that showcase the best of what Jamaica has to offer. From hidden beaches to cultural experiences, we help you discover the real Jamaica - the Jamaica that locals know and love.
          </Typography>
        </Paper>

        <Typography variant="h5" component="h3" gutterBottom align="center">
          Meet Our Team
        </Typography>
        <Grid container spacing={4} sx={{ mb: 4 }}>
          {teamMembers.map((member) => (
            <Grid item xs={12} md={4} key={member.name}>
              <Card>
                <CardMedia
                  component="img"
                  height="200"
                  image={member.image}
                  alt={member.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {member.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.role}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {member.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h5" component="h3" gutterBottom align="center">
          What Our Customers Say
        </Typography>
        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2 }}>
                  "{testimonial.quote}"
                </Typography>
                <Typography variant="subtitle1" color="primary">
                  {testimonial.author}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {testimonial.location}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => window.location.href = '/tours'}
          >
            Explore Our Tours
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default About;
