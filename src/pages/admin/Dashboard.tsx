// TODO: Uncomment and configure Firebase when ready
// import { useAuthState } from 'react-firebase-hooks/auth';
// import { auth } from '../../config/firebase';
// import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// Create a styled Paper component for the dashboard cards
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

const AdminDashboard = () => {
  // TODO: Uncomment when Firebase is configured
  // const [user] = useAuthState(auth);
  const navigate = useNavigate();

  // TODO: Uncomment when Firebase is configured
  // const handleSignOut = async () => {
  //   try {
  //     await signOut(auth);
  //     navigate('/admin/login');
  //   } catch (error) {
  //     console.error('Error signing out:', error);
  //   }
  // };

  // TODO: Uncomment when Firebase is configured
  // if (!user) {
  //   navigate('/admin/login');
  //   return null;
  // }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        {/* TODO: Uncomment when Firebase is configured
        <Button variant="outlined" onClick={handleSignOut}>
          Sign Out
        </Button>
        */}
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
      </StyledGrid>
    </Container>
  );
};

export default AdminDashboard;
