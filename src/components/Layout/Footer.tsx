import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Link as MuiLink, 
  Divider,
  styled,
  useTheme
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  LocationOn as LocationIcon, 
  AccessTime as AccessTimeIcon 
} from '@mui/icons-material';
import SocialMediaLinks from '../SocialMediaLinks';

// Styled components with proper theme typing
import { Theme } from '@mui/material/styles';

interface StyledProps {
  theme: Theme;
}

const FooterLink = styled(MuiLink)(({ theme }: StyledProps) => ({
  color: 'rgba(255, 255, 255, 0.8)',
  display: 'block',
  marginBottom: theme.spacing(1),
  textDecoration: 'none',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    color: theme.palette.secondary.main,
    paddingLeft: theme.spacing(0.5),
  },
  '&:focus': {
    outline: 'none',
    color: theme.palette.secondary.main,
  }
}));

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FooterSection = ({ title, children }: FooterSectionProps) => (
  <Box sx={{ mb: { xs: 3, md: 0 } }}>
    <Typography 
      variant="h6" 
      component="h3" 
      sx={{ 
        color: 'white',
        fontWeight: 600,
        mb: 2,
        position: 'relative',
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: -8,
          left: 0,
          width: 40,
          height: '2px',
          backgroundColor: 'secondary.main',
        },
      }}
    >
      {title}
    </Typography>
    <Box>
      {children}
    </Box>
  </Box>
);

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'primary.dark',
        color: 'rgba(255, 255, 255, 0.8)',
        position: 'relative',
        py: 8,
        mt: 'auto',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, secondary.main 0%, primary.light 100%)',
        },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={6}>
          {/* Brand Info */}
          <Grid xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <img 
                src="/assets/logo.png" 
                alt="28 Degrees West Logo" 
                width={200}
                style={{ height: 'auto' }}
              />
            </Box>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              Elevating your Jamaican experience with exclusive VIP entertainment and luxury adventures 
              designed for the discerning traveler seeking the extraordinary.
            </Typography>
          </Grid>

          {/* Social Media */}
          <Grid xs={12} md={4}>
            <FooterSection title="Follow Us">
              <Box sx={{ mb: 3 }}>
                <SocialMediaLinks 
                  size="medium" 
                  color="default" 
                  spacing={2}
                />
              </Box>
              <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.7)' }}>
                Connect with us on social media for the latest updates and exclusive offers.
              </Typography>
            </FooterSection>
          </Grid>

          {/* Quick Links */}
          <Grid xs={12} sm={6} md={2}>
            <FooterSection title="Explore">
              <FooterLink href="/experiences">Premium Experiences</FooterLink>
              <FooterLink href="/destinations">Luxury Destinations</FooterLink>
              <FooterLink href="/vip-services">VIP Services</FooterLink>
              <FooterLink href="/gallery">Gallery</FooterLink>
              <FooterLink href="/testimonials">Testimonials</FooterLink>
            </FooterSection>
          </Grid>

          {/* Contact Info */}
          <Grid xs={12} sm={6} md={4}>
            <FooterSection title="Contact Us">
              <Box sx={{ display: 'flex', mb: 2 }}>
                <LocationIcon sx={{ mr: 1.5, color: 'secondary.main', minWidth: 20 }} />
                <Typography variant="body1">
                  South Coast, Jamaica
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <EmailIcon sx={{ mr: 1.5, color: 'secondary.main', minWidth: 20 }} />
                <FooterLink href="mailto:nikain@hotmail.com">
                  nikain@hotmail.com
                </FooterLink>
              </Box>
              <Box sx={{ display: 'flex', mb: 2 }}>
                <PhoneIcon sx={{ mr: 1.5, color: 'secondary.main', minWidth: 20 }} />
                <FooterLink href="tel:+447398076328">+44 7398076328</FooterLink>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <AccessTimeIcon sx={{ mr: 1.5, color: 'secondary.main', minWidth: 20 }} />
                <Typography variant="body1">Mon - Sun: 9am - 6pm GMT</Typography>
              </Box>
            </FooterSection>
          </Grid>

          {/* Newsletter */}
          <Grid xs={12} md={4}>
            <FooterSection title="Stay Updated">
              <Typography variant="body1" sx={{ mb: 2 }}>
                Subscribe to our newsletter for exclusive offers and VIP experiences.
              </Typography>
              <Box 
                component="form" 
                sx={{ 
                  display: 'flex',
                  '&:focus-within button': {
                    backgroundColor: 'secondary.dark',
                  },
                }}
              >
                <Box
                  component="input"
                  type="email"
                  placeholder="Your email address"
                  required
                  sx={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px 0 0 4px',
                    fontSize: '0.9rem',
                    '&:focus': {
                      outline: 'none',
                      borderColor: 'secondary.main',
                    },
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.6)',
                    },
                  }}
                />
                <Box
                  component="button"
                  type="submit"
                  sx={{
                    padding: '0 20px',
                    background: theme.palette.secondary.main,
                    color: theme.palette.primary.dark,
                    border: 'none',
                    borderRadius: '0 4px 4px 0',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark,
                    },
                  }}
                >
                  Join
                </Box>
              </Box>
            </FooterSection>
          </Grid>
        </Grid>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {currentYear} 28 Degrees West. All Rights Reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, mt: { xs: 2, sm: 0 } }}>
            <FooterLink 
              href="/privacy" 
              sx={{ 
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                '&:hover': { color: 'secondary.main' },
              }}
            >
              Privacy Policy
            </FooterLink>
            <FooterLink 
              href="/terms" 
              sx={{ 
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.6)',
                '&:hover': { color: 'secondary.main' },
              }}
            >
              Terms of Service
            </FooterLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
