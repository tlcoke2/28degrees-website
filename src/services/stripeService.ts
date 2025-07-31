import { api } from './api';

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
  const response = await api.get('/stripe/config');
  return response.data.data;
};

// Update Stripe configuration (admin only)
export const updateStripeConfig = async (config: Partial<StripeConfig>): Promise<StripeConfig> => {
  const response = await api.put('/stripe/config', config);
  return response.data.data;
};

// Get public Stripe configuration (for client-side use)
export const getPublicStripeConfig = async (): Promise<Omit<StripeConfig, 'secretKey' | 'webhookSecret'>> => {
  const response = await api.get('/stripe/public-config');
  return response.data.data;
};

// Test Stripe connection (admin only)
export const testStripeConnection = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await api.post('/stripe/test-connection');
    return { success: true, ...response.data };
  } catch (error: any) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to connect to Stripe' 
    };
  }
};

// Initialize Stripe with the current publishable key
export const initializeStripe = async (): Promise<any | null> => {
  try {
    const { publishableKey } = await getPublicStripeConfig();
    if (!publishableKey) return null;
    
    // Dynamically import Stripe.js to avoid SSR issues
    const { loadStripe } = await import('@stripe/stripe-js');
    return await loadStripe(publishableKey);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
};
