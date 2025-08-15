// src/services/payments.ts
import { api } from '../services/http.ts'; // axios instance with baseURL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`

// ---- Types ----
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface ConfirmBookingPayload {
  tourId: string;
  date: string;           // ISO string
  participants: number;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  // add other booking fields here if needed
}

export interface ConfirmBookingResponse {
  bookingId: string;
  status: 'confirmed' | 'pending';
  paymentIntentId: string;
}

export interface PaymentDetails {
  id: string;
  status: string;
  amount: number;
  currency: string;
  charges?: unknown;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  refundId: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
  paymentIntentId: string;
}

// ---- Helpers ----
const handleResponse = async <T>(p: Promise<any>): Promise<T> => {
  const res = await p;
  // support both {data: {...}} and envelope {data: {...}}
  return (res?.data?.data ?? res?.data) as T;
};

const idempotency = () => {
  // Browser-safe idempotency key
  return (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

// ---- API ----

/**
 * Create a payment intent for a booking
 * @param amount Amount in the smallest currency unit (e.g., cents)
 * @param currency ISO 4217 (Stripe expects lowercase, e.g., 'usd')
 * @param metadata Additional metadata for the payment intent
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, any> = {}
): Promise<PaymentIntentResponse> => {
  const payload = {
    amount,
    currency: currency.toLowerCase(),
    metadata,
  };

  return handleResponse<PaymentIntentResponse>(
    api.post('/payments/create-payment-intent', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotency(), // helpful to avoid dupes on retries
      },
    })
  );
};

/**
 * Confirm a booking after successful payment
 * @param paymentIntentId Stripe PaymentIntent ID
 * @param bookingDetails Booking details payload
 */
export const confirmBooking = async (
  paymentIntentId: string,
  bookingDetails: ConfirmBookingPayload
): Promise<ConfirmBookingResponse> => {
  return handleResponse<ConfirmBookingResponse>(
    api.post(
      '/bookings/confirm',
      { paymentIntentId, ...bookingDetails },
      { headers: { 'Content-Type': 'application/json' } }
    )
  );
};

/**
 * Get payment details by PaymentIntent ID
 */
export const getPaymentDetails = async (paymentIntentId: string): Promise<PaymentDetails> => {
  return handleResponse<PaymentDetails>(
    api.get(`/payments/${encodeURIComponent(paymentIntentId)}`, {
      headers: { 'Content-Type': 'application/json' },
    })
  );
};

/**
 * Refund a payment (full or partial if amount provided)
 * @param paymentIntentId Stripe PaymentIntent ID
 * @param amount Optional amount in smallest currency unit
 */
export const refundPayment = async (
  paymentIntentId: string,
  amount?: number
): Promise<RefundResponse> => {
  return handleResponse<RefundResponse>(
    api.post(
      '/payments/refund',
      { paymentIntentId, amount },
      {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotency(),
        },
      }
    )
  );
};
