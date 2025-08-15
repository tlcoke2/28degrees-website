// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import theme from './theme/theme';
import './index.css';

// If using a custom domain at root (e.g., https://28degreeswest.com), keep "/"
// If deploying to a repo path (e.g., https://username.github.io/28degrees-website/), set "/28degrees-website/"
const BASENAME =
  import.meta.env.BASE_URL && import.meta.env.BASE_URL !== '/'
    ? import.meta.env.BASE_URL
    : '/';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3}>
            <BrowserRouter basename={BASENAME}>
              <AuthProvider>
                <UserProvider>
                  <CookieConsentProvider>
                    <App />
                  </CookieConsentProvider>
                </UserProvider>
              </AuthProvider>
            </BrowserRouter>
          </SnackbarProvider>
          {import.meta.env.PROD ? null : <ReactQueryDevtools initialIsOpen={false} />}
        </ThemeProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
