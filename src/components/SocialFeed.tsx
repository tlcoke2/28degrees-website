import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab,
  Card, 
  CardContent, 
  CardMedia,
  CardActions,
  Button,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Favorite as LikeIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  MoreHoriz as MoreIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

// Types for social media posts
type SocialPost = {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  username: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: number;
  comments: number;
  shares?: number;
  timestamp: Date;
  url: string;
};

// Mock data - in a real app, this would come from an API
const mockPosts: SocialPost[] = [
  {
    id: '1',
    platform: 'instagram',
    username: '28degreeswest',
    content: 'Exploring the beautiful landscapes of Jamaica! #28DegreesWest #JamaicaTravel',
    imageUrl: 'https://source.unsplash.com/random/800x800/?jamaica,beach',
    likes: 245,
    comments: 32,
    timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
    url: 'https://instagram.com/p/example1'
  },
  {
    id: '2',
    platform: 'facebook',
    username: '28 Degrees West',
    content: 'Join us for an unforgettable adventure in the heart of Jamaica. Book your tour today!',
    imageUrl: 'https://source.unsplash.com/random/800x800/?jamaica,waterfall',
    likes: 189,
    comments: 24,
    shares: 15,
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    url: 'https://facebook.com/posts/example2'
  },
  {
    id: '3',
    platform: 'twitter',
    username: '28DegreesWest',
    content: 'Discover the hidden gems of Jamaica with our expert guides. #TravelTuesday #Jamaica',
    imageUrl: 'https://source.unsplash.com/random/800x800/?jamaica,blue-mountains',
    likes: 98,
    comments: 7,
    timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
    url: 'https://twitter.com/28degreeswest/status/example3'
  },
  {
    id: '4',
    platform: 'instagram',
    username: '28degreeswest',
    content: 'Sunset views you won\'t forget! 🌅 #Jamaica #TravelGoals',
    imageUrl: 'https://source.unsplash.com/random/800x800/?jamaica,sunset',
    likes: 312,
    comments: 45,
    timestamp: new Date(Date.now() - 86400000 * 3), // 3 days ago
    url: 'https://instagram.com/p/example4'
  }
];

type Platform = 'all' | 'instagram' | 'facebook' | 'twitter';

const SocialFeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Platform>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // In a real app, this would be an API call
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPosts(mockPosts);
        setIsLoading(false);
      }, 800);
    };

    fetchPosts();
  }, []);

  const filteredPosts = activeTab === 'all' 
    ? posts 
    : posts.filter(post => post.platform === activeTab);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <InstagramIcon color="secondary" />;
      case 'facebook':
        return <FacebookIcon color="primary" />;
      case 'twitter':
        return <TwitterIcon color="info" />;
      default:
        return null;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: Platform) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons={isMobile ? 'auto' : false}
        allowScrollButtonsMobile
        centered={!isMobile}
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <Tab 
          label="All" 
          value="all" 
          icon={isMobile ? undefined : <MoreIcon />}
          iconPosition="start"
        />
        <Tab 
          label="Instagram" 
          value="instagram" 
          icon={isMobile ? undefined : <InstagramIcon />}
          iconPosition="start"
        />
        <Tab 
          label="Facebook" 
          value="facebook" 
          icon={isMobile ? undefined : <FacebookIcon />}
          iconPosition="start"
        />
        <Tab 
          label="Twitter" 
          value="twitter" 
          icon={isMobile ? undefined : <TwitterIcon />}
          iconPosition="start"
        />
      </Tabs>

      {filteredPosts.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No posts found for {activeTab}.
          </Typography>
        </Box>
      ) : (
        <Box 
          display="grid" 
          gridTemplateColumns={{
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          }} 
          gap={3}
        >
          {filteredPosts.map((post) => (
            <Card key={post.id} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {post.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={post.imageUrl}
                  alt={post.content.substring(0, 50) + '...'}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  {getPlatformIcon(post.platform)}
                  <Typography variant="subtitle2" ml={1} fontWeight="bold">
                    {post.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" ml="auto">
                    {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                  </Typography>
                </Box>
                <Typography variant="body2" paragraph>
                  {post.content.length > 150 
                    ? `${post.content.substring(0, 150)}...` 
                    : post.content}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <IconButton size="small" color="error">
                    <LikeIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary" ml={0.5}>
                    {formatNumber(post.likes)}
                  </Typography>
                </Box>
                <Box>
                  <IconButton size="small" color="default">
                    <CommentIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary" ml={0.5}>
                    {formatNumber(post.comments)}
                  </Typography>
                </Box>
                <IconButton size="small" color="default" href={post.url} target="_blank">
                  <ShareIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
      
      <Box mt={4} textAlign="center">
        <Button 
          variant="outlined" 
          color="primary"
          href={`https://www.instagram.com/explore/tags/28degreeswest/`}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<InstagramIcon />}
        >
          View More on Instagram
        </Button>
      </Box>
    </Box>
  );
};

export default SocialFeed;
