// src/pages/About.tsx
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
  image?: string; // absolute (/images/...) or full URL; optional
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

// Minimal, safe defaults (no real names/images)
const FALLBACK: AboutContent = {
  heading: 'About Us',
  storyIntro:
    "28 Degrees West is more than just a tour company—we're your gateway to experiencing the authentic beauty and culture of Jamaica's south coast.",
  storyBody:
    'Founded by locals who are passionate about sharing their home with the world, we offer unique and memorable experiences that go beyond the typical tourist attractions. Our team of expert guides and local partners work together to create personalized tours that showcase the best of what Jamaica has to offer. From hidden beaches to cultural experiences, we help you discover the real Jamaica—the Jamaica that locals know and love.',
  teamMembers: [],       // ← no hardcoded people/images
  testimonials: [],      // ← optional; render only if present
};

const About: React.FC = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState<AboutContent>(FALLBACK);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const isAdmin =
    typeof window !== 'undefined' && !!localStorage.getItem('adminToken');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError('');

        // PUBLIC endpoint (no /admin suffix → avoids 403)
        // Your axios baseURL should already include /api/v1
        // so this hits: GET /api/v1/content/about
        const res = await api.get<{ data?: AboutContent } | AboutContent>('/content/about');

        const data: AboutContent =
          (res as any)?.data?.data ?? (res as any)?.data ?? {};

        if (!mounted) return;

        // Merge with FALLBACK; don’t force arrays if backend returns none
        setContent({
          ...FALLBACK,
          ...data,
          teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
          testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
        });
      } catch (e: any) {
        // Keep FALLBACK on failure (404/403/etc.) and show soft warning
        setError(e?.response?.data?.message || 'Failed to load About content. Showing defaults.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        {/* Admin-only shortcut to the content editor.
            Pass the current content so the editor can prefill immediately. */}
        {isAdmin && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() =>
                navigate('/admin/content?section=about', {
                  state: { slug: 'about', initial: content },
                })
              }
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
              {content.storyBody && <Typography>{content.storyBody}</Typography>}
            </Paper>

            {/* Team section only if members exist */}
            {(content.teamMembers?.length ?? 0) > 0 && (
              <>
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
                  {content.teamMembers!.map((member, index) => (
                    <Card key={`${member.name || 'member'}-${index}`}>
                      {member.image ? (
                        <CardMedia
                          component="img"
                          height="300"
                          image={member.image}
                          alt={member.name || 'Team member'}
                          onError={(e: any) => {
                            // Graceful fallback if a provided image 404s
                            e.currentTarget.src = '/images/team/placeholder.jpg';
                          }}
                          sx={{ width: '100%', objectFit: 'cover' }}
                        />
                      ) : null}
                      <CardContent>
                        {member.name && (
                          <Typography variant="h6" component="h3">
                            {member.name}
                          </Typography>
                        )}
                        {member.role && (
                          <Typography variant="subtitle1" color="text.secondary">
                            {member.role}
                          </Typography>
                        )}
                        {member.description && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {member.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </>
            )}

            {/* Testimonials only if present */}
            {(content.testimonials?.length ?? 0) > 0 && (
              <>
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
                  {content.testimonials!.map((testimonial, index) => (
                    <Box
                      key={`${testimonial.author || 'guest'}-${index}`}
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
                      {testimonial.quote && (
                        <Typography variant="body1" fontStyle="italic" gutterBottom>
                          “{testimonial.quote}”
                        </Typography>
                      )}
                      <Box sx={{ mt: 'auto' }}>
                        {testimonial.author && (
                          <Typography variant="subtitle2" fontWeight="bold">
                            {testimonial.author}
                          </Typography>
                        )}
                        {testimonial.location && (
                          <Typography variant="caption" color="text.secondary">
                            {testimonial.location}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </>
            )}

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

