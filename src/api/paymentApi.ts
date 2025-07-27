import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create a payment intent for a booking
 * @param amount Amount in the smallest currency unit (e.g., cents)
 * @param currency Currency code (default: 'usd')
 * @param metadata Additional metadata for the payment
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, any> = {}
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/create-payment-intent`,
      { amount, currency, metadata },
      {
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Confirm a booking after successful payment
 * @param paymentIntentId The Stripe payment intent ID
 * @param bookingDetails Details of the booking
 */
export const confirmBooking = async (
  paymentIntentId: string,
  bookingDetails: {
    tourId: string;
    date: string;
    participants: number;
    customerInfo: {
      name: string;
      email: string;
      phone?: string;
    };
    // Add other booking details as needed
  }
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bookings/confirm`,
      {
        paymentIntentId,
        ...bookingDetails,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
};

/**
 * Get payment details by payment intent ID
 * @param paymentIntentId The Stripe payment intent ID
 */
export const getPaymentDetails = async (paymentIntentId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/payments/${paymentIntentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
};

/**
 * Refund a payment
 * @param paymentIntentId The Stripe payment intent ID to refund
 * @param amount Amount to refund in the smallest currency unit (optional, full amount if not specified)
 */
export const refundPayment = async (paymentIntentId: string, amount?: number) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/refund`,
      { paymentIntentId, amount },
      {
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if needed
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};
