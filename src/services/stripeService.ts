import api from './api';

// Define types for Stripe configuration
export interface StripeConfig {
  isActive: boolean;
  publishableKey: string;
  secretKey?: string; // Only used in admin context
  webhookSecret?: string; // Only used in admin context
  commissionRate: number;
  currency: string;
  updatedAt?: string;
}

// Get Stripe configuration (admin only)
export const getStripeConfig = async (): Promise<StripeConfig> => {
  try {
    const response = await api.get('/stripe/config');
    return response?.data?.data || {} as StripeConfig;
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    return {} as StripeConfig;
  }
};

// Update Stripe configuration (admin only)
export const updateStripeConfig = async (config: Partial<StripeConfig>): Promise<StripeConfig> => {
  try {
    const response = await api.put('/stripe/config', config);
    return response?.data?.data || {} as StripeConfig;
  } catch (error) {
    console.error('Error updating Stripe config:', error);
    throw error; // Re-throw to allow components to handle the error
  }
};

// Get public Stripe configuration (for client-side use)
export const getPublicStripeConfig = async (): Promise<Omit<StripeConfig, 'secretKey' | 'webhookSecret'>> => {
  try {
    const response = await api.get('/stripe/public-config');
    return response?.data?.data || {} as Omit<StripeConfig, 'secretKey' | 'webhookSecret'>;
  } catch (error) {
    console.error('Error fetching public Stripe config:', error);
    return {} as Omit<StripeConfig, 'secretKey' | 'webhookSecret'>;
  }
};

// Test Stripe connection (admin only)
export const testStripeConnection = async (params: { 
  secretKey: string; 
  publishableKey: string; 
  isTestMode?: boolean 
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await api.post('/stripe/test-connection', params);
    return { 
      success: response?.data?.success || false, 
      message: response?.data?.message 
    };
  } catch (error: any) {
    console.error('Error testing Stripe connection:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to connect to Stripe' 
    };
  }
};

// Initialize Stripe with the current publishable key
export const initializeStripe = async (): Promise<any | null> => {
  try {
    const config = await getPublicStripeConfig();
    if (typeof window !== 'undefined' && config.publishableKey) {
      const { loadStripe } = await import('@stripe/stripe-js');
      return await loadStripe(config.publishableKey);
    }
    return null;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    return null;
  }
};
