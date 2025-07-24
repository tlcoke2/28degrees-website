import { Box, Container, Typography, Link, IconButton } from '@mui/material';
import { Facebook, Instagram, Twitter, Email, Phone } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Custom Grid component using Box with flexbox
const Grid = ({ children, container, item, xs, sm, md, ...props }: any) => {
  if (container) {
    return (
      <Box 
        display="flex" 
        flexWrap="wrap" 
        width="100%" 
        margin={-2}
        {...props}
      >
        {children}
      </Box>
    );
  }
  
  // Calculate flex basis based on xs, sm, md props
  const getFlexBasis = () => {
    if (md) return { flexBasis: `${(100 / 12) * md}%` };
    if (sm) return { flexBasis: `${(100 / 12) * sm}%` };
    if (xs) return { flexBasis: `${(100 / 12) * xs}%` };
    return {};
  };

  return (
    <Box 
      padding={2}
      boxSizing="border-box"
      {...getFlexBasis()}
      {...props}
    >
      {children}
    </Box>
  );
};

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                28 Degrees West
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Discover the beauty of Jamaica's South Coast with our curated tours and experiences.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <IconButton 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ color: 'white' }}
                >
                  <Facebook />
                </IconButton>
                <IconButton 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ color: 'white' }}
                >
                  <Instagram />
                </IconButton>
                <IconButton 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  sx={{ color: 'white' }}
                >
                  <Twitter />
                </IconButton>
              </Box>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={4} md={2}>
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Explore
              </Typography>
              <Box>
                <Link href="/tours" color="inherit" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Tours
                </Link>
                <Link href="/about" color="inherit" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  About Us
                </Link>
                <Link href="/contact" color="inherit" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Contact
                </Link>
                <Link href="/privacy" color="inherit" sx={{ display: 'block', mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Privacy Policy
                </Link>
              </Box>
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={4} md={3}>
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Contact Us
              </Typography>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Email sx={{ mr: 1 }} fontSize="small" />
                  <Link href="mailto:info@28degreeswest.com" color="inherit" sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    info@28degreeswest.com
                  </Link>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Phone sx={{ mr: 1 }} fontSize="small" />
                  <Link href="tel:+18765551234" color="inherit" sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    +1 (876) 555-1234
                  </Link>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Newsletter */}
          <Grid item xs={12} md={3}>
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Newsletter
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Subscribe to our newsletter for the latest updates and offers.
              </Typography>
              {/* Add newsletter signup form here */}
            </Box>
          </Grid>
        </Grid>
        
        {/* Copyright */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="body2" align="center">
            © {currentYear} 28 Degrees West. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
