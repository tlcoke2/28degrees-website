import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  Button, 
  Typography, 
  Box, 
  Paper, 
  FormGroup, 
  FormControlLabel, 
  Switch,
  Link,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CookieIcon from '@mui/icons-material/Cookie';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: '600px',
    width: '100%',
    margin: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(1),
    },
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const CookieItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 0),
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const CookieDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

interface CookieConsentProps {
  open: boolean;
  onClose: () => void;
  onAccept: (settings: CookieSettings) => void;
  onReject: () => void;
}

export interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ 
  open, 
  onClose, 
  onAccept, 
  onReject 
}) => {
  const [settings, setSettings] = useState<CookieSettings>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const [showDetails, setShowDetails] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Load saved settings from localStorage
  useEffect(() => {
    if (initialLoad) {
      const savedSettings = localStorage.getItem('cookieSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
        } catch (error) {
          console.error('Error parsing cookie settings:', error);
        }
      }
      setInitialLoad(false);
    }
  }, [initialLoad]);

  const handleToggle = (key: keyof CookieSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    setSettings(allAccepted);
    onAccept(allAccepted);
  };

  const handleAcceptSelected = () => {
    onAccept(settings);
  };

  const handleReject = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    setSettings(necessaryOnly);
    onReject();
  };

  const handleClose = () => {
    // Only accept necessary cookies if user closes without making a choice
    if (initialLoad) {
      handleReject();
    }
    onClose();
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={handleClose}
      aria-labelledby="cookie-consent-title"
      maxWidth="md"
    >
      <DialogTitle id="cookie-consent-title" sx={{ 
        display: 'flex', 
        alignItems: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        '& .MuiSvgIcon-root': {
          marginRight: 1,
        }
      }}>
        <CookieIcon />
        Cookie Preferences
      </DialogTitle>
      
      <DialogContent dividers>
        {!showDetails ? (
          <>
            <Typography variant="h6" gutterBottom>
              We value your privacy
            </Typography>
            <DialogContentText color="text.primary" paragraph>
              We use cookies and similar technologies to provide the best experience on our website. 
              Some cookies are necessary for the website to function and cannot be switched off.
            </DialogContentText>
            <DialogContentText color="text.primary" paragraph>
              You can set your preferences for non-essential cookies below or click "Accept All" to 
              consent to all cookies.
            </DialogContentText>
            
            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleAcceptAll}
                fullWidth
                sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              >
                Accept All
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => setShowDetails(true)}
                fullWidth
                sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              >
                Customize Settings
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleReject}
                fullWidth
                sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              >
                Reject All
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, fontSize: '0.75rem' }}>
              By continuing to use our website, you consent to our{' '}
              <Link href="/privacy-policy" color="primary" underline="hover" target="_blank">
                Privacy Policy
              </Link>{' '}
              and our use of cookies as described in our{' '}
              <Link href="/cookie-policy" color="primary" underline="hover" target="_blank">
                Cookie Policy
              </Link>.
            </Typography>
          </>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Manage Cookie Preferences</Typography>
              <IconButton onClick={() => setShowDetails(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Select the types of cookies you want to accept. Your selection will be remembered for future visits.
            </Typography>
            
            <StyledPaper elevation={0} variant="outlined" sx={{ mt: 3 }}>
              <CookieItem>
                <Box>
                  <Typography variant="subtitle2">Necessary Cookies</Typography>
                  <CookieDescription>
                    These cookies are essential for the website to function and cannot be switched off.
                  </CookieDescription>
                </Box>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.necessary} 
                        onChange={handleToggle('necessary')}
                        disabled
                        color="primary"
                      />
                    }
                    label={settings.necessary ? 'Always On' : 'Off'}
                    labelPlacement="start"
                  />
                </FormGroup>
              </CookieItem>
              
              <CookieItem>
                <Box>
                  <Typography variant="subtitle2">Analytics Cookies</Typography>
                  <CookieDescription>
                    These cookies help us understand how visitors interact with our website.
                  </CookieDescription>
                </Box>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.analytics} 
                        onChange={handleToggle('analytics')}
                        color="primary"
                      />
                    }
                    label={settings.analytics ? 'On' : 'Off'}
                    labelPlacement="start"
                  />
                </FormGroup>
              </CookieItem>
              
              <CookieItem>
                <Box>
                  <Typography variant="subtitle2">Marketing Cookies</Typography>
                  <CookieDescription>
                    These cookies are used to track visitors across websites for marketing purposes.
                  </CookieDescription>
                </Box>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.marketing} 
                        onChange={handleToggle('marketing')}
                        color="primary"
                      />
                    }
                    label={settings.marketing ? 'On' : 'Off'}
                    labelPlacement="start"
                  />
                </FormGroup>
              </CookieItem>
              
              <CookieItem>
                <Box>
                  <Typography variant="subtitle2">Preference Cookies</Typography>
                  <CookieDescription>
                    These cookies allow the website to remember choices you make to provide enhanced features.
                  </CookieDescription>
                </Box>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.preferences} 
                        onChange={handleToggle('preferences')}
                        color="primary"
                      />
                    }
                    label={settings.preferences ? 'On' : 'Off'}
                    labelPlacement="start"
                  />
                </FormGroup>
              </CookieItem>
            </StyledPaper>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => setShowDetails(false)}
              >
                Back
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleAcceptSelected}
              >
                Save Preferences
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default CookieConsent;
