import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Box, 
  Tabs, 
  Tab,
  Paper,
  Chip
} from '@mui/material';
import { 
  Event as EventIcon, 
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/UserContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  image: string;
  category: 'concert' | 'sports' | 'theater' | 'other';
}

const Dashboard: React.FC = () => {
  const [value, setValue] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data - replace with API call in production
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockEvents: Event[] = [
          {
            id: '1',
            title: 'Summer Music Festival',
            description: 'Annual summer music festival featuring top artists from around the world.',
            date: '2023-08-15',
            time: '18:00',
            location: 'Central Park, New York',
            price: 99.99,
            image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            category: 'concert'
          },
          {
            id: '2',
            title: 'Premier League: City vs United',
            description: 'Exciting football match between two top teams in the Premier League.',
            date: '2023-08-20',
            time: '20:00',
            location: 'Etihad Stadium, Manchester',
            price: 149.99,
            image: 'https://images.unsplash.com/photo-1579952363872-3f2a6f5a08b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            category: 'sports'
          },
          {
            id: '3',
            title: 'Broadway Show: Hamilton',
            description: 'Award-winning musical about the life of Alexander Hamilton.',
            date: '2023-09-05',
            time: '19:30',
            location: 'Richard Rodgers Theatre, New York',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
            category: 'theater'
          },
        ];
        
        setEvents(mockEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleBookNow = (eventId: string) => {
    navigate(`/book-event/${eventId}`);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'concert':
        return 'primary';
      case 'sports':
        return 'secondary';
      case 'theater':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography variant="h6">Loading events...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome back, {user?.name || 'Guest'}
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Browse and book your next exciting event
      </Typography>

      <Box sx={{ width: '100%', mt: 4, mb: 4 }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="event categories"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Events" {...a11yProps(0)} />
          <Tab label="Concerts" {...a11yProps(1)} />
          <Tab label="Sports" {...a11yProps(2)} />
          <Tab label="Theater" {...a11yProps(3)} />
          <Tab label="My Bookings" {...a11yProps(4)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Grid container spacing={4}>
          {events.map((event) => (
            <Grid item key={event.id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={event.image}
                  alt={event.title}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2">
                      {event.title}
                    </Typography>
                    <Chip 
                      label={event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                      color={getCategoryColor(event.category) as any}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {event.description}
                  </Typography>
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimeIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {event.time}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="h6" color="primary">
                        ${event.price.toFixed(2)}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleBookNow(event.id)}
                        startIcon={<EventIcon />}
                      >
                        Book Now
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
      
      {/* Other tab panels would go here */}
      <TabPanel value={value} index={1}>
        <Typography>Concerts coming soon...</Typography>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Typography>Sports events coming soon...</Typography>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <Typography>Theater shows coming soon...</Typography>
      </TabPanel>
      <TabPanel value={value} index={4}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Your Bookings
          </Typography>
          <Typography color="text.secondary" paragraph>
            You haven't booked any events yet.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => setValue(0)}
            startIcon={<EventIcon />}
          >
            Browse Events
          </Button>
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default Dashboard;
