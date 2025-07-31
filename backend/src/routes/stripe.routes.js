import { Router } from 'express';
import { verifyJWT, verifyPermission } from '../middleware/auth.middleware.js';
import {
  getStripeConfig,
  updateStripeConfig,
  getPublicStripeConfig,
  testStripeConnection,
  handleWebhook,
  verifyWebhook
} from '../controllers/stripe.controller.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Apply rate limiting to all routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
router.use(apiLimiter);

// Webhook endpoint - must be before body parser and not use verifyJWT
router.post('/webhook', handleWebhook);

// Public route to get non-sensitive Stripe config
router.get('/public-config', getPublicStripeConfig);

// Protected admin routes
router.use(verifyJWT);
router.use(verifyPermission(['admin']));

// Stripe configuration routes with input validation
router.route('/config')
  .get(
    // Input validation middleware can be added here if needed
    getStripeConfig
  )
  .put(
    // Add input validation middleware
    (req, res, next) => {
      const { isActive, publishableKey, secretKey, webhookSecret, commissionRate, currency } = req.body;
      
      // Basic validation
      if (typeof isActive !== 'boolean' && typeof isActive !== 'undefined') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      
      if (publishableKey && !publishableKey.startsWith('pk_')) {
        return res.status(400).json({ error: 'Invalid publishable key format' });
      }
      
      if (secretKey && !secretKey.startsWith('sk_')) {
        return res.status(400).json({ error: 'Invalid secret key format' });
      }
      
      if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
        return res.status(400).json({ error: 'Invalid webhook secret format' });
      }
      
      if (commissionRate !== undefined && (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
        return res.status(400).json({ error: 'Commission rate must be between 0 and 100' });
      }
      
      next();
    },
    updateStripeConfig
  );

// Test Stripe connection with additional security
const testConnectionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 test connection attempts per 5 minutes
  message: 'Too many test connection attempts, please try again after 5 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/test-connection', testConnectionLimiter, testStripeConnection);

export default router;
