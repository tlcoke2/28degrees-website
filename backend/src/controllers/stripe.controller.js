import StripeConfig from '../models/StripeConfig.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Stripe from 'stripe';
import express from 'express';
import crypto from 'crypto';

// @desc    Get Stripe configuration
// @route   GET /api/v1/stripe/config
// @access  Private/Admin
export const getStripeConfig = asyncHandler(async (req, res) => {
  let config = await StripeConfig.findOne({}).select('+secretKey +webhookSecret');
  
  // If no config exists, create a default one
  if (!config) {
    config = await StripeConfig.create({});
  }
  
  // Mask sensitive data in the response
  const responseConfig = config.toObject();
  if (responseConfig.secretKey) {
    responseConfig.secretKey = maskString(responseConfig.secretKey);
  }
  if (responseConfig.webhookSecret) {
    responseConfig.webhookSecret = maskString(responseConfig.webhookSecret);
  }
  
  res.status(200).json(
    new ApiResponse(200, responseConfig, 'Stripe configuration retrieved successfully')
  );
});

// Helper function to mask sensitive strings
const maskString = (str, visibleChars = 4) => {
  if (!str) return '';
  if (str.length <= visibleChars * 2) return '*'.repeat(str.length);
  return (
    str.substring(0, visibleChars) +
    '*'.repeat(str.length - visibleChars * 2) +
    str.substring(str.length - visibleChars)
  );
};

// @desc    Update Stripe configuration
// @route   PUT /api/v1/stripe/config
// @access  Private/Admin
export const updateStripeConfig = asyncHandler(async (req, res) => {
  const { isActive, publishableKey, secretKey, webhookSecret, commissionRate, currency } = req.body;

  // Find the config or create a new one if it doesn't exist
  let config = await StripeConfig.findOne({});
  
  if (!config) {
    config = new StripeConfig({
      isActive,
      publishableKey,
      secretKey,
      webhookSecret,
      commissionRate,
      currency
    });
  } else {
    // Only update fields that are provided in the request
    if (typeof isActive !== 'undefined') config.isActive = isActive;
    if (publishableKey) config.publishableKey = publishableKey;
    if (secretKey) config.secretKey = secretKey;
    if (webhookSecret) config.webhookSecret = webhookSecret;
    if (commissionRate !== undefined) config.commissionRate = commissionRate;
    if (currency) config.currency = currency;
  }

  await config.save();

  // Don't send sensitive data in the response
  const responseConfig = config.toObject();
  delete responseConfig.secretKey;
  delete responseConfig.webhookSecret;
  delete responseConfig.__v;

  res.status(200).json(
    new ApiResponse(200, responseConfig, 'Stripe configuration updated successfully')
  );
});

// @desc    Get public Stripe configuration (without sensitive data)
// @route   GET /api/v1/stripe/public-config
// @access  Public
export const getPublicStripeConfig = asyncHandler(async (req, res) => {
  const config = await StripeConfig.findOne({ isActive: true })
    .select('-secretKey -webhookSecret -__v');
  
  if (!config) {
    throw new ApiError(404, 'No active Stripe configuration found');
  }
  
  res.status(200).json(
    new ApiResponse(200, config, 'Public Stripe configuration retrieved successfully')
  );
});

// @desc    Test Stripe connection
// @route   POST /api/v1/stripe/test-connection
// @access  Private/Admin
export const testStripeConnection = asyncHandler(async (req, res) => {
  const config = await StripeConfig.findOne({}).select('+secretKey');
  
  if (!config || !config.secretKey) {
    throw new ApiError(400, 'Stripe is not properly configured');
  }
  
  try {
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16', // Use the latest API version
      timeout: 10000, // 10 seconds timeout
    });
    
    // Test connection by making a balance API call (lightweight)
    const balance = await stripe.balance.retrieve();
    
    // Check if the account has the necessary capabilities
    const account = await stripe.accounts.retrieve();
    const hasPaymentsEnabled = account.capabilities?.card_payments === 'active';
    const hasPayoutsEnabled = account.capabilities?.transfers === 'active';
    
    res.status(200).json(
      new ApiResponse(200, { 
        success: true, 
        balance: {
          available: balance.available[0].amount,
          currency: balance.available[0].currency,
        },
        capabilities: {
          payments: hasPaymentsEnabled,
          payouts: hasPayoutsEnabled,
        },
        accountType: account.type || 'standard',
      }, 'Successfully connected to Stripe')
    );
  } catch (error) {
    console.error('Stripe connection error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to connect to Stripe';
    if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Invalid API key provided';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection to Stripe timed out. Please check your network connection.';
    } else if (error.raw && error.raw.message) {
      errorMessage = error.raw.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new ApiError(400, errorMessage);
  }
});

// @desc    Verify Stripe webhook signature
// @middleware
// @access  Private/Webhook
export const verifyWebhook = async (req, res, next) => {
  try {
    const config = await StripeConfig.findOne({ isActive: true });
    
    if (!config || !config.webhookSecret) {
      console.error('Webhook verification failed: No active webhook secret found');
      return res.status(400).json({ error: 'Webhook not configured' });
    }
    
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      console.error('Webhook verification failed: Missing signature');
      return res.status(400).json({ error: 'Missing signature' });
    }
    
    const stripe = new Stripe(config.secretKey);
    
    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody || JSON.stringify(req.body),
        signature,
        config.webhookSecret
      );
      
      req.stripeEvent = event;
      next();
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Handle Stripe webhook events
// @route   POST /api/v1/stripe/webhook
// @access  Public (Stripe will call this)
export const handleWebhook = [
  // Express.raw is needed for Stripe webhook signature verification
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  },
  
  // Parse JSON body
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
  
  // Verify webhook signature
  verifyWebhook,
  
  // Handle the webhook event
  asyncHandler(async (req, res) => {
    const event = req.stripeEvent;
    
    // Log the event for debugging
    console.log(`Received event: ${event.type}`);
    
    // Handle the event based on its type
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent was successful!', paymentIntent.id);
        // Handle successful payment
        break;
        
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('PaymentMethod was attached!', paymentMethod.id);
        break;
        
      case 'charge.succeeded':
        const charge = event.data.object;
        console.log('Charge was successful!', charge.id);
        // Handle successful charge
        break;
        
      case 'charge.failed':
        const failedCharge = event.data.object;
        console.error('Charge failed:', failedCharge.failure_message);
        // Handle failed charge
        break;
        
      // ... handle other event types
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  })
];
