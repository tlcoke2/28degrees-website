import { AppBar, Toolbar, Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const Banner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        py: 2,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <RouterLink to="/" style={{ textDecoration: 'none' }}>
            <Box 
              component="div"
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              <img 
                src="/assets/logo.png" 
                alt="28 Degrees West Logo" 
                width={isMobile ? 150 : 200}
                style={{
                  height: 'auto',
                  maxWidth: '100%',
                }}
              />
            </Box>
          </RouterLink>
          
          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
            <Box
              component={RouterLink}
              to="/tours"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: location.pathname === '/tours' ? 'bold' : 'normal',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Tours
            </Box>
            <Box
              component={RouterLink}
              to="/about"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: location.pathname === '/about' ? 'bold' : 'normal',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              About
            </Box>
            <Box
              component={RouterLink}
              to="/contact"
              sx={{
                textDecoration: 'none',
                color: 'text.primary',
                fontWeight: location.pathname === '/contact' ? 'bold' : 'normal',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Contact
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Banner;
