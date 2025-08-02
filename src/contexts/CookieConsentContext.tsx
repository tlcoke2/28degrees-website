import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

export interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

interface CookieConsentContextType {
  cookieSettings: CookieSettings;
  showConsent: boolean;
  updateCookieSettings: (settings: CookieSettings) => void;
  acceptAllCookies: () => void;
  rejectAllCookies: () => void;
  showConsentDialog: () => void;
  hideConsentDialog: () => void;
}

const defaultSettings: CookieSettings = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

const COOKIE_SETTINGS_KEY = 'cookieSettings';
const COOKIE_CONSENT_KEY = 'cookieConsentGiven';

export const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

interface CookieConsentProviderProps {
  children: ReactNode;
}

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({ children }) => {
  const [cookieSettings, setCookieSettings] = useState<CookieSettings>(defaultSettings);
  const [showConsent, setShowConsent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved settings on initial render
  useEffect(() => {
    const loadSettings = () => {
      try {
        // Check if user has already given consent
        const consentGiven = localStorage.getItem(COOKIE_CONSENT_KEY);
        
        if (consentGiven === 'true') {
          // Load saved settings if consent was given
          const savedSettings = localStorage.getItem(COOKIE_SETTINGS_KEY);
          if (savedSettings) {
            setCookieSettings(JSON.parse(savedSettings));
          }
          setShowConsent(false);
        } else {
          // Show consent banner if no consent was given yet
          setShowConsent(true);
        }
      } catch (error) {
        console.error('Error loading cookie settings:', error);
        // Default to showing consent if there's an error
        setShowConsent(true);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  // Update cookies when settings change
  const updateCookieSettings = (settings: CookieSettings) => {
    try {
      setCookieSettings(settings);
      localStorage.setItem(COOKIE_SETTINGS_KEY, JSON.stringify(settings));
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      setShowConsent(false);
      
      // Initialize analytics and marketing services based on preferences
      initializeServices(settings);
    } catch (error) {
      console.error('Error updating cookie settings:', error);
    }
  };

  const acceptAllCookies = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    updateCookieSettings(allAccepted);
  };

  const rejectAllCookies = () => {
    const necessaryOnly = {
      necessary: true, // Necessary cookies cannot be rejected
      analytics: false,
      marketing: false,
      preferences: false,
    };
    updateCookieSettings(necessaryOnly);
  };

  const showConsentDialog = () => {
    setShowConsent(true);
  };

  const hideConsentDialog = () => {
    setShowConsent(false);
  };

  // Initialize third-party services based on cookie settings
  const initializeServices = (settings: CookieSettings) => {
    if (settings.analytics) {
      // Initialize analytics services (e.g., Google Analytics)
      initializeAnalytics();
    } else {
      // Disable analytics if not accepted
      disableAnalytics();
    }

    if (settings.marketing) {
      // Initialize marketing services (e.g., Facebook Pixel, Google Ads)
      initializeMarketing();
    } else {
      // Disable marketing if not accepted
      disableMarketing();
    }
  };

  // Placeholder functions for initializing third-party services
  const initializeAnalytics = () => {
    // Initialize Google Analytics, Mixpanel, etc.
    console.log('Initializing analytics services');
    // Example: window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
  };

  const disableAnalytics = () => {
    // Disable analytics tracking
    console.log('Disabling analytics services');
    // Example: window.gtag('consent', 'update', { 'analytics_storage': 'denied' });
  };

  const initializeMarketing = () => {
    // Initialize marketing trackers
    console.log('Initializing marketing services');
    // Example: window.fbq('consent', 'grant');
  };

  const disableMarketing = () => {
    // Disable marketing trackers
    console.log('Disabling marketing services');
    // Example: window.fbq('consent', 'revoke');
  };

  // Don't render the context provider until we've loaded the settings
  if (!isInitialized) {
    return null;
  }

  return (
    <CookieConsentContext.Provider
      value={{
        cookieSettings,
        showConsent,
        updateCookieSettings,
        acceptAllCookies,
        rejectAllCookies,
        showConsentDialog,
        hideConsentDialog,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = (): CookieConsentContextType => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};
