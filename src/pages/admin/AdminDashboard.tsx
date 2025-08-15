import React, { useEffect, useMemo, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { userService, tourService, eventService, bookingService, type Booking } from '../../services/api';

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  height: '100%',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[2],
  transition: 'transform 0.2s, box-shadow 0.2s',
  cursor: 'pointer',
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

type Counts = {
  users: number | null;
  tours: number | null;
  events: number | null;
  revenueMTD: number | null; // in default currency units
};

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { admin } = useAdmin();

  const [counts, setCounts] = useState<Counts>({
    users: null,
    tours: null,
    events: null,
    revenueMTD: null,
  });

  const [recentActivities, setRecentActivities] = useState<
    { id: string; text: string; time: string }[]
  >([]);

  // Format helper for currency
  const formatMoney = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    } catch {
      return { format: (n: number) => `$${Math.round(n).toLocaleString()}` } as Intl.NumberFormat;
    }
  }, []);

  useEffect(() => {
    (async () => {
      // We’ll fetch everything in parallel and swallow individual failures
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      try {
        const [
          usersRes,
          toursRes,
          eventsRes,
          bookingsRes,
        ] = await Promise.allSettled([
          // userService.getAllUsers is typed as paginated; some backends may return an array.
          // We’ll normalize counts defensively.
          userService.getAllUsers?.(1, 1, {}) as any,
          tourService.getAllTours?.() as any,
          eventService.getAllEvents?.() as any,
          bookingService.getAllBookings?.(1, 100, { dateFrom: monthStart.toISOString() }) as any,
        ]);

        // Users
        let usersCount: number | null = null;
        if (usersRes.status === 'fulfilled') {
          const u = usersRes.value as any;
          usersCount = typeof u?.total === 'number' ? u.total : Array.isArray(u) ? u.length : null;
        }

        // Tours
        let toursCount: number | null = null;
        if (toursRes.status === 'fulfilled') {
          const t = toursRes.value as any;
          toursCount = Array.isArray(t) ? t.length : Array.isArray(t?.data) ? t.data.length : null;
        }

        // Events
        let eventsCount: number | null = null;
        if (eventsRes.status === 'fulfilled') {
          const e = eventsRes.value as any;
          eventsCount = typeof e?.total === 'number' ? e.total : Array.isArray(e?.data) ? e.data.length : Array.isArray(e) ? e.length : null;
        }

        // Revenue (MTD) & activities from bookings
        let revenueMTD: number | null = null;
        let activities: { id: string; text: string; time: string }[] = [];
        if (bookingsRes.status === 'fulfilled') {
          const b = bookingsRes.value as any;
          const bookings: Booking[] =
            Array.isArray(b?.data) ? b.data :
            Array.isArray(b?.items) ? b.items :
            Array.isArray(b) ? b : [];

          // Sum only confirmed/paid bookings, fallback to any with totalAmount/price
          const total = bookings.reduce((sum, bk) => {
            const isPaid =
              (bk as any).status === 'confirmed' ||
              (bk as any).status === 'paid' ||
              (bk as any).paymentStatus === 'paid';
            if (!isPaid) return sum;

            const amt = typeof (bk as any).totalAmount === 'number'
              ? (bk as any).totalAmount
              : typeof (bk as any).price === 'number'
              ? (bk as any).price
              : 0;
            return sum + (amt || 0);
          }, 0);

          revenueMTD = total;

          // Recent activity (latest 5)
          activities = bookings.slice(0, 5).map((bk: any) => ({
            id: bk.id || bk._id || Math.random().toString(36).slice(2),
            text: bk?.tourOrEvent?.title
              ? `Booking: ${bk.tourOrEvent.title} — ${bk.status || bk.paymentStatus || 'pending'}`
              : `Booking ${bk.id || bk._id} — ${bk.status || bk.paymentStatus || 'pending'}`,
            time: new Date(bk.bookingDate || bk.createdAt || Date.now()).toLocaleString(),
          }));
        }

        setCounts({ users: usersCount, tours: toursCount, events: eventsCount, revenueMTD });
        if (activities.length) setRecentActivities(activities);
      } catch {
        // Ignore — leave defaults/nulls; UI will still render
      }
    })();
  }, []);

  const statCards = [
    {
      icon: <PeopleIcon />,
      value: counts.users == null ? '—' : counts.users.toLocaleString(),
      label: 'Total Users',
      color: theme.palette.primary.main,
      path: '/admin/users',
    },
    {
      icon: <TourIcon />,
      value: counts.tours == null ? '—' : counts.tours.toString(),
      label: 'Active Tours',
      color: theme.palette.success.main,
      path: '/admin/tours',
    },
    {
      icon: <EventIcon />,
      value: counts.events == null ? '—' : counts.events.toString(),
      label: 'Upcoming Events',
      color: theme.palette.warning.main,
      path: '/admin/events',
    },
    {
      icon: <PaymentIcon />,
      value: counts.revenueMTD == null ? '—' : formatMoney.format(counts.revenueMTD),
      label: 'Revenue (MTD)',
      color: theme.palette.info.main,
      path: '/admin/bookings',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {admin?.displayName || 'Admin'}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Here&apos;s what&apos;s happening with your business today
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard
              role="button"
              tabIndex={0}
              onClick={() => navigate(stat.path)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(stat.path)}
            >
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
              {(recentActivities.length ? recentActivities : [
                { id: 'placeholder-1', text: 'No recent activity yet', time: '' },
              ]).map((activity) => (
                <Box
                  key={activity.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography variant="body1">{activity.text}</Typography>
                  {activity.time ? (
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  ) : null}
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
                { label: 'Add New Tour', path: '/admin/tours' },        // open list; dialog from there
                { label: 'Create Event', path: '/admin/events' },       // open list; dialog from there
                { label: 'View Bookings', path: '/admin/bookings' },
                { label: 'Manage Users', path: '/admin/users' },
                { label: 'Stripe Settings', path: '/admin/stripe-config' },
                { label: 'Site Settings', path: '/admin/settings' },    // include if you added this route
              ].map((action, index) => (
                <Box
                  key={index}
                  role="button"
                  tabIndex={0}
                  sx={{
                    py: 1.5,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { color: theme.palette.primary.main, cursor: 'pointer' },
                  }}
                  onClick={() => navigate(action.path)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(action.path)}
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

