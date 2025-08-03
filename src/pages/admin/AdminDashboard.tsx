import React from 'react';
import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  People as PeopleIcon,
  Event as EventIcon,
  Tour as TourIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAdmin } from '../../contexts/AdminContext';

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  height: '100%',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const StatIcon = styled(Box)(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.contrastText,
  backgroundColor: theme.palette.primary.main,
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  margin: '8px 0',
  color: theme.palette.text.primary,
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const AdminDashboard = () => {
  const theme = useTheme();
  const { admin } = useAdmin();

  // Mock data - in a real app, this would come from an API
  const stats = [
    {
      icon: <PeopleIcon />,
      value: '1,234',
      label: 'Total Users',
      color: theme.palette.primary.main,
      path: '/admin/users',
    },
    {
      icon: <TourIcon />,
      value: '42',
      label: 'Active Tours',
      color: theme.palette.success.main,
      path: '/admin/tours',
    },
    {
      icon: <EventIcon />,
      value: '18',
      label: 'Upcoming Events',
      color: theme.palette.warning.main,
      path: '/admin/events',
    },
    {
      icon: <PaymentIcon />,
      value: '$12,345',
      label: 'Revenue (MTD)',
      color: theme.palette.info.main,
      path: '/admin/bookings',
    },
  ];

  const recentActivities = [
    { id: 1, text: 'New user registration: John Doe', time: '5 min ago' },
    { id: 2, text: 'Booking #1234 confirmed', time: '12 min ago' },
    { id: 3, text: 'New tour added: "Mountain Adventure"', time: '1 hour ago' },
    { id: 4, text: 'Payment received: $249.99', time: '2 hours ago' },
    { id: 5, text: 'New event created: "Sunset Cruise"', time: '5 hours ago' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {admin?.displayName || 'Admin'}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Here's what's happening with your business today
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard>
              <StatIcon sx={{ backgroundColor: stat.color }}>
                {React.cloneElement(stat.icon, { fontSize: 'large' })}
              </StatIcon>
              <StatValue variant="h3">{stat.value}</StatValue>
              <StatLabel variant="body2">{stat.label}</StatLabel>
            </StatCard>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                Recent Activities
              </Typography>
            </Box>
            <Box>
              {recentActivities.map((activity) => (
                <Box
                  key={activity.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <Typography variant="body1">{activity.text}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {activity.time}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <NotificationsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" component="h2">
                Quick Actions
              </Typography>
            </Box>
            <Box>
              {[
                { label: 'Add New Tour', path: '/admin/tours/new' },
                { label: 'Create Event', path: '/admin/events/new' },
                { label: 'View Bookings', path: '/admin/bookings' },
                { label: 'Manage Users', path: '/admin/users' },
                { label: 'Site Settings', path: '/admin/settings' },
              ].map((action, index) => (
                <Box
                  key={index}
                  sx={{
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                    '&:hover': {
                      color: theme.palette.primary.main,
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => window.location.href = action.path}
                >
                  <Typography variant="body1">{action.label}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
