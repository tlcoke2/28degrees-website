import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/** ---------- Helpers ---------- **/

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not defined`);
  return v;
}

function getStripeClient() {
  const key = requireEnv('STRIPE_SECRET_KEY');
  // Avoid logging secrets in prod; if you must, only tail:
  // console.log('Stripe init: ****' + key.slice(-4));
  return new Stripe(key, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 3,
    timeout: 10000,
  });
}

/**
 * Resolve pricing on the server. Replace this stub with a DB lookup.
 * Return the price in the smallest unit (cents).
 */
async function resolveTourPriceCents(tourId) {
  // TODO: fetch from DB by tourId
  // Example fallback (replace): 99.00 USD
  return 9900;
}

function parseQuantity(n) {
  const q = Number(n);
  return Number.isFinite(q) && q >= 1 ? Math.floor(q) : 1;
}

/** ---------- Create PaymentIntent (optional/kept) ---------- **/
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const stripe = getStripeClient();

    const { tourId, quantity = 1, currency = 'usd', metadata = {}, amountCents } = req.body;

    if (!tourId) return res.status(400).json({ error: 'tourId is required' });

    const qty = parseQuantity(quantity);

    // Prefer server-computed pricing; only fall back to amountCents if explicitly allowed.
    const unitPrice = amountCents && Number.isFinite(Number(amountCents))
      ? Number(amountCents)
      : await resolveTourPriceCents(tourId);

    const totalCents = unitPrice * qty;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents, // already in cents
      currency: String(currency || 'usd').toLowerCase(),
      metadata: { ...metadata, tourId, quantity: String(qty) },
      automatic_payment_methods: { enabled: true },
    }, {
      idempotencyKey: req.get('Idempotency-Key') || undefined,
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/** ---------- Create Checkout Session (new, matches your frontend) ---------- **/
router.post('/checkout-session', async (req, res) => {
  try {
    const stripe = getStripeClient();

    const {
      tourId,
      quantity = 1,
      date, // yyyy-mm-dd
      customerInfo = {},
      metadata = {},
      currency = 'usd',
    } = req.body;

    if (!tourId) return res.status(400).json({ error: 'tourId is required' });
    const qty = parseQuantity(quantity);
    const unitPrice = await resolveTourPriceCents(tourId);
    const totalCents = unitPrice * qty;

    const APP_BASE_URL = requireEnv('APP_BASE_URL'); // e.g., https://28degreeswest.com
    const successUrl = `${APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${APP_BASE_URL}/payment/cancel`;

    // Prefer server-controlled product/price descriptors
    const lineItems = [{
      price_data: {
        currency: String(currency || 'usd').toLowerCase(),
        product_data: {
          name: `Tour #${tourId}`,
          // You can add description, images here
        },
        unit_amount: unitPrice, // cents
      },
      quantity: qty,
    }];

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        tourId,
        date: date || '',
        quantity: String(qty),
        customerName: customerInfo?.name || '',
        customerEmail: customerInfo?.email || '',
        customerPhone: customerInfo?.phone || '',
      },
      // Automatic tax, address collection if needed:
      // automatic_tax: { enabled: true },
      // customer_creation: 'if_required',
    }, {
      idempotencyKey: req.get('Idempotency-Key') || undefined,
    });

    // Frontend expects { url } or { checkoutUrl }
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to start checkout session' });
  }
});

/** ---------- Webhook (must be raw; mount before JSON body parser) ---------- **/
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = getStripeClient();
    const endpointSecret = requireEnv('STRIPE_WEBHOOK_SECRET');
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        // session.metadata has tourId, quantity, date, etc.
        // TODO: mark booking as paid, create booking record, email customer, etc.
        console.log('Checkout completed:', session.id);
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log('PaymentIntent succeeded:', pi.id);
        // If you use PaymentIntents directly, finalize booking here
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).send('Webhook handler error');
  }
});

export default router;
