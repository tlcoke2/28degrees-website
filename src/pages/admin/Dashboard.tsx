import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAdmin } from '../../contexts/AdminContext';

// Create a styled Paper component for the dashboard cards
const DashboardCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));



const AdminDashboard = () => {
  const navigate = useNavigate();
  const { admin, loading } = useAdmin();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!admin) {
    navigate('/admin/login');
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {admin.displayName || 'Admin'}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your website content and settings from this dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
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
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard>
            <div>
              <Typography variant="h6" gutterBottom>
                Users
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage user accounts and permissions.
              </Typography>
            </div>
            <Button variant="contained" fullWidth onClick={() => navigate('/admin/users')}>
              Manage Users
            </Button>
          </DashboardCard>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard>
            <div>
              <Typography variant="h6" gutterBottom>
                Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure website settings and preferences.
              </Typography>
            </div>
            <Button variant="contained" fullWidth onClick={() => navigate('/admin/settings')}>
              Manage Settings
            </Button>
          </DashboardCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
