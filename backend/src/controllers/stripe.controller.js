// src/controllers/stripeConfig.controller.js
import express from 'express';
import Stripe from 'stripe';
import StripeConfig from '../models/StripeConfig.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

/* ------------------------------- Utilities ------------------------------- */

const STRIPE_API_VERSION = '2024-06-20';

function maskString(str, visible = 4) {
  if (!str) return '';
  if (str.length <= visible * 2) return '*'.repeat(str.length);
  return str.slice(0, visible) + '*'.repeat(str.length - visible * 2) + str.slice(-visible);
}

function pick(obj = {}, keys = []) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

/* --------------------------------- Admin --------------------------------- */

// @desc    Get Stripe configuration (admin, masked)
// @route   GET /api/v1/stripe/config
// @access  Private/Admin
export const getStripeConfig = asyncHandler(async (_req, res) => {
  // Get the most recently updated config (active or not)
  let config = await StripeConfig.findOne().sort({ updatedAt: -1 }).select('+secretKey +webhookSecret').lean();

  // If none exists, create a default inert record
  if (!config) {
    const created = await StripeConfig.create({});
    config = created.toObject();
  }

  // Mask secrets before returning
  if (config.secretKey) config.secretKey = maskString(config.secretKey);
  if (config.webhookSecret) config.webhookSecret = maskString(config.webhookSecret);

  return res
    .status(200)
    .json(new ApiResponse(200, config, 'Stripe configuration retrieved successfully'));
});

// @desc    Update Stripe configuration (admin)
// @route   PUT /api/v1/stripe/config
// @access  Private/Admin
export const updateStripeConfig = asyncHandler(async (req, res) => {
  const fields = pick(req.body, [
    'isActive',
    'publishableKey',
    'secretKey',
    'webhookSecret',
    'commissionRate',
    'currency',
    'isTestMode',
    'metadata',
  ]);

  // Find most recent config or create one
  let config = await StripeConfig.findOne().sort({ updatedAt: -1 });
  if (!config) {
    config = new StripeConfig(fields);
  } else {
    Object.assign(config, fields);
  }

  // Record who updated it (if auth middleware sets req.user)
  if (req.user?.id) {
    config.updatedBy = req.user.id;
    if (config.isNew) config.createdBy = req.user.id;
  }

  await config.save(); // model-level validation will enforce required fields if activating

  // If we just activated this config, ensure all others are inactive
  if (config.isActive) {
    await StripeConfig.updateMany(
      { _id: { $ne: config._id } },
      { $set: { isActive: false } }
    );
  }

  // Prepare safe response
  const response = config.toObject();
  delete response.secretKey;
  delete response.webhookSecret;
  delete response.__v;

  return res
    .status(200)
    .json(new ApiResponse(200, response, 'Stripe configuration updated successfully'));
});

// @desc    Get public Stripe configuration (no secrets)
// @route   GET /api/v1/stripe/public-config
// @access  Public
export const getPublicStripeConfig = asyncHandler(async (_req, res) => {
  const config = await StripeConfig.findOne({ isActive: true }).select('-secretKey -webhookSecret -__v').lean();
  if (!config) throw new ApiError(404, 'No active Stripe configuration found');

  return res
    .status(200)
    .json(new ApiResponse(200, config, 'Public Stripe configuration retrieved successfully'));
});

// @desc    Test Stripe connection (admin)
// @route   POST /api/v1/stripe/test-connection
// @access  Private/Admin
export const testStripeConnection = asyncHandler(async (_req, res) => {
  const config = await StripeConfig.findOne().sort({ updatedAt: -1 }).select('+secretKey +webhookSecret');
  if (!config || !config.secretKey) throw new ApiError(400, 'Stripe is not properly configured');

  try {
    // Use the model’s built-in tester (persists testStatus/testMessage/lastTested)
    await config.testConnection();

    // For convenience, also return a lightweight account snapshot
    const stripe = new Stripe(config.secretKey, { apiVersion: STRIPE_API_VERSION, timeout: 10000 });
    const balance = await stripe.balance.retrieve();
    const account = await stripe.accounts.retrieve();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          success: true,
          balance: {
            available: balance?.available?.[0]?.amount ?? 0,
            currency: balance?.available?.[0]?.currency ?? config.currency?.toLowerCase?.() ?? 'usd',
          },
          capabilities: {
            payments: account?.capabilities?.card_payments === 'active',
            payouts: account?.capabilities?.transfers === 'active',
          },
          accountType: account?.type || 'standard',
          lastTested: config.lastTested,
          testStatus: config.testStatus,
          testMessage: config.testMessage,
        },
        'Successfully connected to Stripe'
      )
    );
  } catch (error) {
    const msg =
      error?.type === 'StripeAuthenticationError'
        ? 'Invalid API key provided'
        : error?.code === 'ETIMEDOUT'
        ? 'Connection to Stripe timed out. Please check your network connection.'
        : error?.raw?.message || error?.message || 'Failed to connect to Stripe';
    throw new ApiError(400, msg);
  }
});

/* ---------------------------- Webhook handling ---------------------------- */
/**
 * Mount like:
 *   router.post('/webhook', handleWebhook); // do NOT put express.json() before this route
 *
 * This exports a middleware array that:
 *  1) uses express.raw({ type: 'application/json' }) so we have the raw buffer
 *  2) verifies the Stripe signature using the active config
 *  3) attaches the verified event at req.stripeEvent
 *  4) handles a few common events (log-only by default)
 */

// Verify Stripe webhook signature using the active config
export const verifyWebhook = asyncHandler(async (req, res, next) => {
  const active = await StripeConfig.getActiveConfig();
  if (!active?.secretKey || !active?.webhookSecret) {
    return res.status(400).json({ error: 'Webhook not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing signature' });

  const stripe = new Stripe(active.secretKey, { apiVersion: STRIPE_API_VERSION });
  try {
    req.stripeEvent = stripe.webhooks.constructEvent(req.body, signature, active.webhookSecret);
    return next();
  } catch (err) {
    // Do not log the raw body to avoid leaking PII
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

// Handle the webhook event (log-only sample; your payments webhook should live in payments routes)
export const handleWebhook = [
  // 1) Raw body required BEFORE any JSON body parser
  express.raw({ type: 'application/json' }),

  // 2) Verify and attach req.stripeEvent
  verifyWebhook,

  // 3) Process event
  asyncHandler(async (req, res) => {
    const event = req.stripeEvent;
    // Minimal examples; main booking logic should be in /api/v1/payments/webhook
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log('Stripe: payment_intent.succeeded', pi.id);
        break;
      }
      case 'charge.succeeded': {
        const charge = event.data.object;
        console.log('Stripe: charge.succeeded', charge.id);
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Stripe: checkout.session.completed', session.id);
        // Defer booking creation to your payments webhook (already implemented).
        break;
      }
      default:
        console.log('Stripe: unhandled event', event.type);
    }

    // Acknowledge receipt
    return res.status(200).json({ received: true });
  }),
];
