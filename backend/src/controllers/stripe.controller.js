// src/controllers/stripeConfig.controller.js
import express from 'express';
import Stripe from 'stripe';
import StripeConfig from '../models/StripeConfig.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const STRIPE_API_VERSION = '2024-06-20';

/* ------------------------------- Helpers ------------------------------- */
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
const EMPTY_CONFIG = {
  isActive: false,
  publishableKey: '',
  // never include secrets on responses
  commissionRate: 0,
  currency: 'USD',
  isTestMode: false,
  metadata: {
    allowedPaymentMethods: ['card'],
    pricingTiers: [],
  },
};

/* --------------------------------- Admin --------------------------------- */

// GET /api/v1/stripe/config
export const getStripeConfig = asyncHandler(async (req, res) => {
  // Prefer most recently updated; could also prefer { isActive: true }
  const doc = await StripeConfig.findOne().sort({ updatedAt: -1 }).select('+secretKey +webhookSecret').lean();

  if (!doc) {
    // Return a safe, non-persisted default (don’t attempt to create without createdBy/updatedBy)
    return res
      .status(200)
      .json(new ApiResponse(200, EMPTY_CONFIG, 'Stripe configuration (default)'));
  }

  // Mask secrets before responding
  const out = {
    ...doc,
    secretKey: doc.secretKey ? maskString(doc.secretKey) : '',
    webhookSecret: doc.webhookSecret ? maskString(doc.webhookSecret) : '',
  };
  delete out.__v;

  return res.status(200).json(new ApiResponse(200, out, 'Stripe configuration retrieved successfully'));
});

// PUT /api/v1/stripe/config
export const updateStripeConfig = asyncHandler(async (req, res) => {
  const fields = pick(req.body, [
    'isActive',
    'publishableKey',
    'secretKey',
    'webhookSecret',
    'commissionRate',
    'currency',
    'isTestMode',
    'metadata', // { allowedPaymentMethods, pricingTiers }
  ]);

  // Normalize currency if present (routes already try to do this)
  if (fields.currency && typeof fields.currency === 'string') {
    fields.currency = fields.currency.toUpperCase();
  }

  // Find most recent or create a new document
  let config = await StripeConfig.findOne().sort({ updatedAt: -1 });

  if (!config) {
    config = new StripeConfig(fields);
    // Admin route is protected; we expect req.user.id to exist
    if (req.user?.id) {
      config.createdBy = req.user.id;
      config.updatedBy = req.user.id;
    }
  } else {
    Object.assign(config, fields);
    if (req.user?.id) {
      config.updatedBy = req.user.id;
      // createdBy is immutable in our schema; leave it as-is
    }
  }

  await config.save(); // model validations enforce required fields when isActive=true, etc.

  // Ensure only one active configuration at a time
  if (config.isActive) {
    await StripeConfig.updateMany({ _id: { $ne: config._id } }, { $set: { isActive: false } });
  }

  const response = config.toObject();
  delete response.secretKey;
  delete response.webhookSecret;
  delete response.__v;

  return res.status(200).json(new ApiResponse(200, response, 'Stripe configuration updated successfully'));
});

// GET /api/v1/stripe/public-config
export const getPublicStripeConfig = asyncHandler(async (_req, res) => {
  const active = await StripeConfig.findOne({ isActive: true }).select('-secretKey -webhookSecret -__v').lean();
  if (!active) throw new ApiError(404, 'No active Stripe configuration found');

  return res.status(200).json(new ApiResponse(200, active, 'Public Stripe configuration retrieved successfully'));
});

// POST /api/v1/stripe/test-connection
export const testStripeConnection = asyncHandler(async (_req, res) => {
  const config = await StripeConfig.findOne().sort({ updatedAt: -1 }).select('+secretKey +webhookSecret');
  if (!config || !config.secretKey) throw new ApiError(400, 'Stripe is not properly configured');

  try {
    // Persist test result fields (lastTested, testStatus, testMessage)
    await config.testConnection();

    // Also return a quick snapshot
    const stripe = new Stripe(config.secretKey, { apiVersion: STRIPE_API_VERSION, timeout: 10000 });
    const balance = await stripe.balance.retrieve();
    const account = await stripe.accounts.retrieve();

    return res.status(200).json(
      new ApiResponse(200, {
        success: true,
        balance: {
          available: balance?.available?.[0]?.amount ?? 0,
          currency: (balance?.available?.[0]?.currency ?? config.currency ?? 'USD').toUpperCase(),
        },
        capabilities: {
          payments: account?.capabilities?.card_payments === 'active',
          payouts: account?.capabilities?.transfers === 'active',
        },
        accountType: account?.type || 'standard',
        lastTested: config.lastTested,
        testStatus: config.testStatus,
        testMessage: config.testMessage,
      }, 'Successfully connected to Stripe')
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
 *   router.post('/webhook', handleWebhook); // NO express.json() before this
 * The middleware array:
 *  1) uses express.raw to preserve the buffer
 *  2) verifies signature with the active config
 *  3) attaches req.stripeEvent
 *  4) logs a few common events (booking logic should live in your payments webhook)
 */

export const verifyWebhook = asyncHandler(async (req, res, next) => {
  const active = await StripeConfig.getActiveConfig();
  if (!active?.secretKey || !active?.webhookSecret) {
    return res.status(400).json({ error: 'Webhook not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'Missing signature' });

  const stripe = new Stripe(active.secretKey, { apiVersion: STRIPE_API_VERSION });
  try {
    // req.body is a Buffer thanks to express.raw in handleWebhook
    req.stripeEvent = stripe.webhooks.constructEvent(req.body, signature, active.webhookSecret);
    return next();
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
});

export const handleWebhook = [
  express.raw({ type: 'application/json' }),
  verifyWebhook,
  asyncHandler(async (req, res) => {
    const event = req.stripeEvent;

    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('Stripe: payment_intent.succeeded', event.data.object.id);
        break;
      case 'charge.succeeded':
        console.log('Stripe: charge.succeeded', event.data.object.id);
        break;
      case 'checkout.session.completed':
        console.log('Stripe: checkout.session.completed', event.data.object.id);
        // Booking creation/refunds should be handled in your primary payments webhook.
        break;
      default:
        console.log('Stripe: unhandled event', event.type);
    }

    return res.status(200).json({ received: true });
  }),
];
