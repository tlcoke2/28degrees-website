// src/services/stripeService.ts
import { api } from './http';

// --- Types ---
export interface StripeConfig {
  isActive: boolean;
  publishableKey: string;
  secretKey?: string;      // admin only
  webhookSecret?: string;  // admin only
  commissionRate: number;  // percent, e.g. 10 = 10%
  currency: string;        // e.g. 'USD'
  updatedAt?: string;
}

// --- Endpoint paths (api base is /api/v1 from the axios instance) ---
const ADMIN_CONFIG = '/admin/stripe/config';
const ADMIN_TEST   = '/admin/stripe/test-connection';
const PUBLIC_CONFIG = '/stripe/public-config';

// Admin-only: Get full config
export const getStripeConfig = async (): Promise<StripeConfig> => {
  const res = await api.get(ADMIN_CONFIG);
  // Expect either { data: { ...config } } or { ...config }
  const payload = res?.data?.data ?? res?.data;
  if (!payload) throw new Error('No Stripe config returned from server');
  return payload as StripeConfig;
};

// Admin-only: Update config
export const updateStripeConfig = async (config: Partial<StripeConfig>): Promise<StripeConfig> => {
  const res = await api.put(ADMIN_CONFIG, config);
  const payload = res?.data?.data ?? res?.data;
  if (!payload) throw new Error('Failed to update Stripe config');
  return payload as StripeConfig;
};

// Public: Get safe (client) config (no secrets)
export const getPublicStripeConfig = async (): Promise<Omit<StripeConfig, 'secretKey' | 'webhookSecret'>> => {
  try {
    const res = await api.get(PUBLIC_CONFIG);
    const payload = res?.data?.data ?? res?.data ?? {};
    return payload as Omit<StripeConfig, 'secretKey' | 'webhookSecret'>;
  } catch (err) {
    console.error('Error fetching public Stripe config:', err);
    return {} as Omit<StripeConfig, 'secretKey' | 'webhookSecret'>;
  }
};

// Admin-only: Test Stripe credentials
export const testStripeConnection = async (params: {
  secretKey: string;
  publishableKey: string;
  isTestMode?: boolean;
}): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await api.post(ADMIN_TEST, params);
    const success = Boolean(res?.data?.success);
    const message = res?.data?.message;
    return { success, message };
  } catch (error: any) {
    console.error('Error testing Stripe connection:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to connect to Stripe',
    };
  }
};

// Initialize Stripe.js on the client using the public publishable key
export const initializeStripe = async () => {
  try {
    const cfg = await getPublicStripeConfig();
    if (typeof window !== 'undefined' && cfg?.publishableKey) {
      const { loadStripe } = await import('@stripe/stripe-js');
      return await loadStripe(cfg.publishableKey);
    }
    return null;
  } catch (err) {
    console.error('Error initializing Stripe:', err);
    return null;
  }
};
