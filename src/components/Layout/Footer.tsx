import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  Divider,
  styled,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // ✅ Grid v2 (handles xs/md without 'item')
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import SocialMediaLinks from '../SocialMediaLinks';

const FooterLink = styled(MuiLink)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.85)',
  display: 'block',
  marginBottom: theme.spacing(1),
  textDecoration: 'none',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  minWidth: 0,
  wordBreak: 'break-word',
  hyphens: 'auto',
  '&:hover,&:focus': {
    color: theme.palette.secondary.main,
    paddingLeft: theme.spacing(0.5),
    outline: 'none',
  },
}));

interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FooterSection = ({ title, children }: FooterSectionProps) => (
  <Box sx={{ mb: { xs: 3, md: 0 }, minWidth: 0 }}>
    <Typography
      variant="h6"
      component="h3"
      sx={{
        color: 'white',
        fontWeight: 600,
        mb: 2,
        position: 'relative',
        pr: 1,
        minWidth: 0,
        wordBreak: 'break-word',
        hyphens: 'auto',
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
    <Box sx={{ minWidth: 0 }}>{children}</Box>
  </Box>
);

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={(t) => ({
        backgroundColor: t.palette.primary.dark,
        color: 'rgba(255, 255, 255, 0.9)',
        position: 'relative',
        py: { xs: 6, md: 8 },
        mt: 'auto',
        overflow: 'hidden', // keep everything inside the colored area
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundImage: `linear-gradient(90deg, ${t.palette.secondary.main} 0%, ${t.palette.primary.light} 100%)`,
        },
      })}
    >
      <Container maxWidth="lg" sx={{ minWidth: 0 }}>
        <Grid container spacing={6}>
          {/* Brand Info */}
          <Grid xs={12} md={4}>
            <Box sx={{ mb: 3, minWidth: 0 }}>
              <img
                src="/assets/logo.png"
                alt="28 Degrees West Logo"
                width={200}
                style={{ height: 'auto', display: 'block' }}
              />
            </Box>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                lineHeight: 1.7,
                minWidth: 0,
                wordBreak: 'break-word',
                hyphens: 'auto',
              }}
            >
              Elevating your Jamaican experience with exclusive VIP entertainment and
              luxury adventures designed for the discerning traveler seeking the
              extraordinary.
            </Typography>
          </Grid>

          {/* Social Media */}
          <Grid xs={12} md={4}>
            <FooterSection title="Follow Us">
              <Box sx={{ mb: 3 }}>
                <SocialMediaLinks size="medium" color="default" spacing={2} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  color: 'rgba(255,255,255,0.75)',
                  minWidth: 0,
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                Connect with us on social media for the latest updates and exclusive
                offers.
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
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2, minWidth: 0 }}>
                <LocationIcon sx={{ mr: 1.5, color: 'secondary.main', flexShrink: 0 }} />
                <Typography sx={{ minWidth: 0, wordBreak: 'break-word', hyphens: 'auto' }}>
                  South Coast, Jamaica
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, minWidth: 0 }}>
                <EmailIcon sx={{ mr: 1.5, color: 'secondary.main', flexShrink: 0 }} />
                <FooterLink
                  href="mailto:info@28degreeswest.com"
                  sx={{ minWidth: 0, overflowWrap: 'anywhere' }}
                >
                  info@28degreeswest.com
                </FooterLink>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, minWidth: 0 }}>
                <PhoneIcon sx={{ mr: 1.5, color: 'secondary.main', flexShrink: 0 }} />
                <FooterLink href="tel:+447398076328">+44 7398076328</FooterLink>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <AccessTimeIcon sx={{ mr: 1.5, color: 'secondary.main', flexShrink: 0 }} />
                <Typography sx={{ minWidth: 0, wordBreak: 'break-word', hyphens: 'auto' }}>
                  Mon&nbsp;–&nbsp;Sun: 9am&nbsp;–&nbsp;6pm GMT
                </Typography>
              </Box>
            </FooterSection>
          </Grid>

          {/* Newsletter */}
          <Grid xs={12} md={4}>
            <FooterSection title="Stay Updated">
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  minWidth: 0,
                  wordBreak: 'break-word',
                  hyphens: 'auto',
                }}
              >
                Subscribe to our newsletter for exclusive offers and VIP experiences.
              </Typography>

              <Box
                component="form"
                onSubmit={(e: React.FormEvent) => e.preventDefault()}
                sx={{
                  display: 'flex',
                  alignItems: 'stretch',
                  minWidth: 0,
                  maxWidth: 520,
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
                    minWidth: 0,
                    padding: '12px 16px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    borderRadius: '4px 0 0 4px',
                    fontSize: '0.95rem',
                    lineHeight: 1.4,
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
                    px: 2.5,
                    background: theme.palette.secondary.main,
                    color: theme.palette.primary.dark,
                    border: 'none',
                    borderRadius: '0 4px 4px 0',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease',
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

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.15)' }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1,
            gap: 2,
            minWidth: 0,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 0, textAlign: 'center' }}
          >
            © {currentYear} 28 Degrees West. All Rights Reserved.
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <FooterLink
              href="/privacy"
              sx={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
                '&:hover': { color: 'secondary.main' },
              }}
            >
              Privacy Policy
            </FooterLink>
            <FooterLink
              href="/terms"
              sx={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
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
