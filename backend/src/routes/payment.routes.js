import express from 'express';
import { Router } from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Function to get or initialize the Stripe client
function getStripeClient() {
  // Check if environment variable is available
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is not defined in environment variables');
    throw new Error('Stripe secret key is not configured');
  }
  
  // Log that we're initializing Stripe (without exposing the key)
  console.log('Initializing Stripe client with key:', '***' + process.env.STRIPE_SECRET_KEY.slice(-4));
  
  // Create and return a new Stripe client
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 3,
    timeout: 10000,
  });
}

// Middleware to ensure Stripe client is available
const withStripeClient = (req, res, next) => {
  try {
    // Get or create a new Stripe client for each request
    req.stripe = getStripeClient();
    next();
  } catch (error) {
    console.error('❌ Failed to initialize Stripe client:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Payment service is currently unavailable',
      error: error.message 
    });
  }
};

/**
 * @route   POST /api/v1/payments/create-payment-intent
 * @desc    Create a payment intent for a booking
 * @access  Private
 */
router.post('/create-payment-intent', protect, withStripeClient, async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Validate amount
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'A valid amount is required' });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await req.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        ...metadata,
        userId: req.user.id,
      },
      // Enable automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Stripe webhook events
 * @access  Public (Stripe needs to access this endpoint)
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      // TODO: Update your database here
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('PaymentMethod was attached!', paymentMethod.id);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

export default router;
