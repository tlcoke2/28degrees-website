import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import Banner from './Banner';
import Footer from './Footer';

interface AppLayoutProps {
  children: ReactNode;
}

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a365d', // Dark blue
    },
    secondary: {
      main: '#e53e3e', // Red
    },
    background: {
      default: '#f7fafc', // Light gray
    },
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
  },
});

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  // Removed unused router as it's not needed in the current implementation
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Banner />
        <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
          <Container maxWidth="lg">
            {children}
          </Container>
        </Box>
        <Footer />
      </Box>
    </ThemeProvider>
  );
};

export default AppLayout;
