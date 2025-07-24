import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Grid, Typography, Paper } from '@mui/material';

const AdminDashboard = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    navigate('/admin/login');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Button variant="outlined" onClick={handleSignOut}>
          Sign Out
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Tours Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add, edit, or remove tours and packages.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/admin/tours')}>
              Manage Tours
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Events Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage events and immersive experiences.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/admin/events')}>
              Manage Events
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Bookings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              View and manage customer bookings.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/admin/bookings')}>
              View Bookings
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage admin and user accounts.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/admin/users')}>
              Manage Users
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
