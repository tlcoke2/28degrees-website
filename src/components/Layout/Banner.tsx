import { Box, Container, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const Banner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '80vh' : '90vh',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/images/hero-bg.jpg') center/cover no-repeat`,
        color: 'white',
        textAlign: 'center',
        padding: theme.spacing(3),
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <motion.div variants={itemVariants}>
            <Typography
              variant={isMobile ? 'h4' : 'h2'}
              component="h1"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.05em',
                mb: 3,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                lineHeight: 1.2,
              }}
            >
              Discover Jamaica's Hidden Gems
            </Typography>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="h2"
              sx={{
                fontWeight: 400,
                mb: 4,
                maxWidth: '800px',
                mx: 'auto',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                lineHeight: 1.6,
              }}
            >
              Experience luxury, adventure, and authentic culture with our exclusive tours and personalized services
            </Typography>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: theme.spacing(2),
            }}
          >
            <Button
              component={RouterLink}
              to="/tours"
              variant="contained"
              color="primary"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '50px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 24px rgba(0, 0, 0, 0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Explore Tours
            </Button>
            <Button
              component={RouterLink}
              to="/contact"
              variant="outlined"
              color="inherit"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '50px',
                borderWidth: '2px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderWidth: '2px',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Contact Us
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              animation: 'bounce 2s infinite',
              cursor: 'pointer',
            }}
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth',
              });
            }}
          >
            <svg
              width="40px"
              height="40px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 10L12 15L17 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      </Container>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) translateX(-50%);
          }
          40% {
            transform: translateY(-10px) translateX(-50%);
          }
          60% {
            transform: translateY(-5px) translateX(-50%);
          }
        }
      `}</style>
    </Box>
  );
};

export default Banner;
