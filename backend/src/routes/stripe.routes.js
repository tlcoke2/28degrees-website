// src/routes/stripe.routes.ts (or .js)
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyJWT, verifyPermission } from '../middleware/auth.middleware.js';
import {
  getStripeConfig,
  updateStripeConfig,
  getPublicStripeConfig,
  testStripeConnection,
  handleWebhook,
} from '../controllers/stripe.controller.js';

const router = Router();

/**
 * ⚠️ Webhook: no JWT, no body parser, no rate limit.
 * `handleWebhook` already installs the raw body + verification inside its middleware array.
 * Mount this FIRST so it isn't affected by the limiter below.
 */
router.post('/webhook', handleWebhook);

// ---------- Rate limiting for the rest ----------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(apiLimiter);

// ---------- Public ----------
router.get('/public-config', getPublicStripeConfig);

// ---------- Admin-protected ----------
router.use(verifyJWT);
router.use(verifyPermission(['admin']));

/**
 * Validate basic fields AND metadata used by the admin UI:
 * - metadata.allowedPaymentMethods: array of supported strings
 * - metadata.pricingTiers: array of { key, name, priceCents, currency?, appliesTo[], active }
 */
const validateConfigInput = (req, res, next) => {
  const {
    isActive,
    publishableKey,
    secretKey,
    webhookSecret,
    commissionRate,
    currency,
    isTestMode,
    metadata,
  } = req.body || {};

  if (typeof isActive !== 'undefined' && typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be a boolean' });
  }
  if (typeof isTestMode !== 'undefined' && typeof isTestMode !== 'boolean') {
    return res.status(400).json({ error: 'isTestMode must be a boolean' });
  }

  if (publishableKey && !String(publishableKey).startsWith('pk_')) {
    return res.status(400).json({ error: 'Invalid publishable key format' });
  }
  if (secretKey && !String(secretKey).startsWith('sk_')) {
    return res.status(400).json({ error: 'Invalid secret key format' });
  }
  if (webhookSecret && !String(webhookSecret).startsWith('whsec_')) {
    return res.status(400).json({ error: 'Invalid webhook secret format' });
  }

  if (
    typeof commissionRate !== 'undefined' &&
    (Number.isNaN(Number(commissionRate)) ||
      Number(commissionRate) < 0 ||
      Number(commissionRate) > 100)
  ) {
    return res.status(400).json({ error: 'Commission rate must be between 0 and 100' });
  }

  if (currency && typeof currency === 'string') {
    req.body.currency = currency.toUpperCase();
  }

  // ---- metadata checks (optional but recommended) ----
  const ALLOWED_PMS = new Set([
    'card',
    'link',
    'us_bank_account',
    'cashapp',
    'klarna',
    'afterpay_clearpay',
    'affirm',
  ]);
  const ALLOWED_APPLIES = new Set(['tour', 'event', 'product']);

  if (metadata) {
    // allowedPaymentMethods
    if (metadata.allowedPaymentMethods) {
      if (!Array.isArray(metadata.allowedPaymentMethods)) {
        return res.status(400).json({ error: 'metadata.allowedPaymentMethods must be an array' });
      }
      const bad = metadata.allowedPaymentMethods.find((pm) => !ALLOWED_PMS.has(pm));
      if (bad) {
        return res.status(400).json({ error: `Unsupported payment method: ${bad}` });
      }
    }

    // pricingTiers
    if (metadata.pricingTiers) {
      if (!Array.isArray(metadata.pricingTiers)) {
        return res.status(400).json({ error: 'metadata.pricingTiers must be an array' });
      }
      for (const tier of metadata.pricingTiers) {
        if (!tier || typeof tier !== 'object') {
          return res.status(400).json({ error: 'Each pricing tier must be an object' });
        }
        const { key, name, priceCents, currency: tierCurrency, appliesTo, active } = tier;

        if (!key || typeof key !== 'string') {
          return res.status(400).json({ error: 'Tier key is required and must be a string' });
        }
        if (!name || typeof name !== 'string') {
          return res.status(400).json({ error: 'Tier name is required and must be a string' });
        }
        if (!Number.isInteger(priceCents) || priceCents < 0) {
          return res.status(400).json({ error: 'Tier priceCents must be a non-negative integer' });
        }
        if (typeof active !== 'boolean') {
          return res.status(400).json({ error: 'Tier active must be a boolean' });
        }
        if (tierCurrency && typeof tierCurrency === 'string') {
          tier.currency = tierCurrency.toUpperCase();
        }
        if (!Array.isArray(appliesTo) || appliesTo.length === 0) {
          return res.status(400).json({ error: 'Tier appliesTo must be a non-empty array' });
        }
        const badApply = appliesTo.find((a) => !ALLOWED_APPLIES.has(a));
        if (badApply) {
          return res.status(400).json({ error: `Tier appliesTo contains unsupported value: ${badApply}` });
        }
      }
    }
  }

  return next();
};

router
  .route('/config')
  .get(getStripeConfig)
  .put(validateConfigInput, updateStripeConfig);

// Separate (stricter) limiter for the connection test
const testConnectionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: 'Too many test connection attempts, please try again after 5 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
router.post('/test-connection', testConnectionLimiter, testStripeConnection);

export default router;
