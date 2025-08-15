import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const DashboardCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const StyledGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing(3),
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: '1fr',
  },
}));

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  };

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

      <StyledGrid>
        <DashboardCard>
          <div>
            <Typography variant="h6" gutterBottom>
              Tours Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add, edit, or remove tours and packages.
            </Typography>
          </div>
          <Button variant="contained" fullWidth onClick={() => navigate('/admin/tours')}>
            Manage Tours
          </Button>
        </DashboardCard>

        <DashboardCard>
          <div>
            <Typography variant="h6" gutterBottom>
              Events Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage upcoming events and activities.
            </Typography>
          </div>
          <Button variant="contained" fullWidth onClick={() => navigate('/admin/events')}>
            Manage Events
          </Button>
        </DashboardCard>

        <DashboardCard>
          <div>
            <Typography variant="h6" gutterBottom>
              Bookings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              View and manage tour and event bookings.
            </Typography>
          </div>
          <Button variant="contained" fullWidth onClick={() => navigate('/admin/bookings')}>
            View Bookings
          </Button>
        </DashboardCard>

        <DashboardCard>
          <div>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Manage user accounts and permissions.
            </Typography>
          </div>
          <Button variant="contained" fullWidth onClick={() => navigate('/admin/users')}>
            Manage Users
          </Button>
        </DashboardCard>

        <DashboardCard>
          <div>
            <Typography variant="h6" gutterBottom>
              Payment Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure Stripe payment gateway settings and payment options.
            </Typography>
          </div>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate('/admin/stripe-config')}
            sx={{
              background: 'linear-gradient(45deg, #635bff 30%, #8f56ff 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4a45b3 30%, #7c4dff 90%)',
              },
            }}
          >
            Configure Payments
          </Button>
        </DashboardCard>
      </StyledGrid>
    </Container>
  );
};

export default AdminDashboard;

