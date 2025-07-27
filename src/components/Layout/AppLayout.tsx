import React, { ReactNode, useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemText,
  useScrollTrigger,
  Slide,
  useMediaQuery,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Banner from './Banner';
import Footer from './Footer';

// Smooth scroll to top component
function ScrollTop({ children }: { children: React.ReactElement }) {
  const trigger = useScrollTrigger({
    target: window,
    disableHysteresis: true,
    threshold: 100,
  });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = ((event.target as HTMLDivElement).ownerDocument || document)
      .querySelector('#back-to-top-anchor');
    
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Slide direction="up" in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
      >
        {children}
      </Box>
    </Slide>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'Tours', path: '/tours' },
  { name: 'Social', path: '/social' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', py: 2 }}>
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.name} 
            component={RouterLink} 
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              color: 'text.primary',
              '&.Mui-selected': {
                color: 'primary.main',
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              },
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemText primary={item.name} primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <AppBar 
        position="fixed" 
        elevation={scrolled ? 4 : 0}
        sx={{
          backgroundColor: scrolled ? 'background.paper' : 'transparent',
          color: scrolled ? 'text.primary' : 'common.white',
          transition: 'all 0.3s ease-in-out',
          boxShadow: scrolled ? theme.shadows[4] : 'none',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: scrolled ? 'none' : `1px solid ${theme.palette.divider}`,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <Button
                component={RouterLink}
                to="/"
                sx={{
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Box
                  component="img"
                  src="/logo.png"
                  alt="28 Degrees West Logo"
                  sx={{
                    height: 40,
                    width: 'auto',
                    mr: 1,
                  }}
                />
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '.3rem',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  28°WEST
                </Typography>
              </Button>

              {!isMobile && (
                <Box sx={{ display: 'flex', ml: 4 }}>
                  {navItems.map((item) => (
                    <Button
                      key={item.name}
                      component={RouterLink}
                      to={item.path}
                      sx={{
                        color: 'inherit',
                        mx: 1,
                        fontWeight: location.pathname === item.path ? 600 : 400,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      {item.name}
                    </Button>
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/bookings"
                sx={{
                  ml: 2,
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Book Now
              </Button>

              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ ml: 2 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box',
              width: 250,
              backgroundColor: 'background.paper',
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Scroll anchor and offset */}
      <div id="back-to-top-anchor" style={{ position: 'absolute', top: 0 }} />
      <Toolbar />

      <Banner />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: 4,
          mt: { xs: 8, md: 12 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
      
      <Footer />
      
      {/* Scroll to top button */}
      <ScrollTop>
        <Button
          variant="contained"
          color="primary"
          sx={{
            minWidth: 'auto',
            width: 40,
            height: 40,
            borderRadius: '50%',
            p: 0,
            boxShadow: 3,
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: 6,
            },
            transition: 'all 0.3s ease',
          }}
        >
          ↑
        </Button>
      </ScrollTop>
    </Box>
  );
};

export default AppLayout;
