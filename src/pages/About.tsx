import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import api from '../services/api'; // default export from src/services/api.ts
import { useNavigate } from 'react-router-dom';

type TeamMember = {
  name: string;
  role: string;
  description?: string;
  image?: string;
};

type Testimonial = {
  quote: string;
  author: string;
  location?: string;
};

type AboutContent = {
  heading?: string;
  storyIntro?: string;
  storyBody?: string;
  teamMembers?: TeamMember[];
  testimonials?: Testimonial[];
  heroImage?: string;
};

const FALLBACK: AboutContent = {
  heading: 'About Us',
  storyIntro:
    "28 Degrees West is more than just a tour company—we're your gateway to experiencing the authentic beauty and culture of Jamaica's south coast.",
  storyBody:
    'Founded by locals who are passionate about sharing their home with the world, we offer unique and memorable experiences that go beyond the typical tourist attractions. Our team of expert guides and local partners work together to create personalized tours that showcase the best of what Jamaica has to offer. From hidden beaches to cultural experiences, we help you discover the real Jamaica—the Jamaica that locals know and love.',
  teamMembers: [
    {
      name: 'Nikisha Farquarson',
      role: 'Founder & CEO',
      description: 'Passionate about sharing the beauty of Jamaica with the world',
      image: '/assets/images/team/john-smith.jpg',
    },
    {
      name: 'Kevin Gordon',
      role: 'Tour Guide',
      description: 'Local expert with extensive knowledge of Jamaican culture',
      image: '/assets/images/team/sarah-johnson.jpg',
    },
    {
      name: 'Thueman Coke',
      role: 'Operations Manager',
      description: 'Ensures smooth operation of all tours and experiences',
      image: '/assets/images/team/michael-brown.jpg',
    },
  ],
  testimonials: [
    {
      quote:
        'The South Coast Adventure tour was absolutely amazing! Our guide was incredibly knowledgeable and made the experience unforgettable.',
      author: 'Emma Wilson',
      location: 'London, UK',
    },
    {
      quote:
        "I can't recommend 28 Degrees West enough. Their attention to detail and commitment to customer satisfaction is second to none.",
      author: 'James Chen',
      location: 'Singapore',
    },
    {
      quote:
        'The Waterfall Experience tour was breathtaking. The natural beauty of Jamaica combined with excellent service made it a trip of a lifetime.',
      author: 'Lisa Martinez',
      location: 'Los Angeles, USA',
    },
  ],
};

const About: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<AboutContent>(FALLBACK);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const isAdmin = typeof window !== 'undefined' && !!localStorage.getItem('adminToken');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        // GET /api/v1/cms/about — returns { data: AboutContent }
        const res = await api.get<{ data: AboutContent }>('/cms/about');
        const data = res?.data?.data || {};
        if (mounted) {
          // Merge onto fallback so missing fields don’t break the UI
          setContent({
            ...FALLBACK,
            ...data,
            teamMembers: (data.teamMembers && data.teamMembers.length > 0 ? data.teamMembers : FALLBACK.teamMembers),
            testimonials: (data.testimonials && data.testimonials.length > 0
              ? data.testimonials
              : FALLBACK.testimonials),
          });
        }
      } catch (e: any) {
        // On failure, keep FALLBACK but show a soft error
        setError(e?.message || 'Failed to load About content. Showing defaults.');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        {/* Admin-only shortcut to the content editor */}
        {isAdmin && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/admin/content?section=about')}
            >
              Edit About Content
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="h3" component="h2" gutterBottom align="center">
              {content.heading || 'About Us'}
            </Typography>

            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Our Story
              </Typography>
              {content.storyIntro && (
                <Typography paragraph>{content.storyIntro}</Typography>
              )}
              {content.storyBody && (
                <Typography>{content.storyBody}</Typography>
              )}
            </Paper>

            <Typography variant="h5" component="h3" gutterBottom align="center">
              Meet Our Team
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 4,
                mt: 4,
                mb: 4,
              }}
            >
              {(content.teamMembers || []).map((member, index) => (
                <Card key={`${member.name}-${index}`}>
                  {member.image && (
                    <CardMedia
                      component="img"
                      height="300"
                      image={member.image}
                      alt={member.name}
                      sx={{ width: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" component="h3">
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      {member.role}
                    </Typography>
                    {member.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {member.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Typography variant="h5" component="h3" gutterBottom align="center">
              What Our Customers Say
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 4,
                mt: 4,
                mb: 4,
              }}
            >
              {(content.testimonials || []).map((testimonial, index) => (
                <Box
                  key={`${testimonial.author}-${index}`}
                  sx={{
                    p: 3,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography variant="body1" fontStyle="italic" gutterBottom>
                    “{testimonial.quote}”
                  </Typography>
                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {testimonial.author}
                    </Typography>
                    {testimonial.location && (
                      <Typography variant="caption" color="text.secondary">
                        {testimonial.location}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => navigate('/tours')}
                sx={{ mt: 2 }}
              >
                Explore Our Tours
              </Button>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default About;
