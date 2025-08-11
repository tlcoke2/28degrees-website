// src/routes/payment.routes.js
import express from 'express';
import Stripe from 'stripe';
import { protect } from '../middleware/auth.middleware.js';
import { sendMail } from '../utils/mailer.js';
import { bookingConfirmedTemplate } from '../templates/email/booking-confirmed.js';

const router = express.Router();

/** ---------- Helpers ---------- **/

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not defined`);
  return v;
}

function getStripeClient() {
  const key = requireEnv('STRIPE_SECRET_KEY');
  return new Stripe(key, {
    // Use a recent, supported API version
    apiVersion: '2024-06-20',
    maxNetworkRetries: 3,
    timeout: 10000,
  });
}

/**
 * Resolve pricing on the server. Replace this stub with a DB lookup.
 * Return the price in the smallest unit (cents).
 */
async function resolveTourPriceCents(tourId) {
  // TODO: fetch price from DB using tourId
  // Example fallback (replace in production): 99.00 USD
  return 9900;
}

function parseQuantity(n) {
  const q = Number(n);
  return Number.isFinite(q) && q >= 1 ? Math.floor(q) : 1;
}

function ensureJsonBody(req, res) {
  // Some misconfigured clients send no body or wrong content-type.
  // We only accept objects here.
  const body = req?.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({
      error:
        'Missing or invalid JSON body. Send Content-Type: application/json with a JSON object.',
    });
    return null;
  }
  return body;
}

/** ---------- Create PaymentIntent (kept; requires auth) ---------- **/
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const body = ensureJsonBody(req, res);
    if (!body) return;

    const stripe = getStripeClient();

    const {
      tourId,
      quantity = 1,
      currency = 'usd',
      metadata = {},
      amountCents,
    } = body;

    if (!tourId) {
      return res.status(400).json({ error: 'tourId is required' });
    }

    const qty = parseQuantity(quantity);

    // Prefer server-computed pricing; only fall back to amountCents if explicitly allowed.
    const unitPrice =
      amountCents && Number.isFinite(Number(amountCents))
        ? Number(amountCents)
        : await resolveTourPriceCents(tourId);

    const totalCents = unitPrice * qty;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: totalCents, // already in cents
        currency: String(currency || 'usd').toLowerCase(),
        metadata: { ...metadata, tourId, quantity: String(qty) },
        automatic_payment_methods: { enabled: true },
      },
      {
        idempotencyKey: req.get('Idempotency-Key') || undefined,
      }
    );

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

/** ---------- Create Checkout Session (matches frontend) ---------- **/
router.post('/checkout-session', async (req, res) => {
  try {
    const body = ensureJsonBody(req, res);
    if (!body) return;

    const stripe = getStripeClient();

    const {
      tourId,
      quantity = 1,
      date, // yyyy-mm-dd
      customerInfo = {},
      metadata = {},
      currency = 'usd',
    } = body;

    if (!tourId) {
      return res.status(400).json({ error: 'tourId is required' });
    }

    const qty = parseQuantity(quantity);
    const unitPrice = await resolveTourPriceCents(tourId);

    const APP_BASE_URL = requireEnv('APP_BASE_URL'); // e.g., https://28degreeswest.com
    const successUrl = `${APP_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${APP_BASE_URL}/payment/cancel`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: String(currency || 'usd').toLowerCase(),
              product_data: {
                name: `Tour #${tourId}`,
              },
              unit_amount: unitPrice, // cents
            },
            quantity: qty,
          },
        ],
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
      },
      {
        idempotencyKey: req.get('Idempotency-Key') || undefined,
      }
    );

    // Frontend expects { url }
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to start checkout session' });
  }
});

/** ---------- Webhook (must be raw; mount before JSON body parser) ---------- **/
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // IMPORTANT: Do not put express.json() before this route
    try {
      const stripe = getStripeClient();
      const endpointSecret = requireEnv('STRIPE_WEBHOOK_SECRET');
      const sig = req.headers['stripe-signature'];

      if (!sig) {
        console.error('Missing Stripe signature header');
        return res.status(400).send('Missing Stripe signature');
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        // 400 tells Stripe to retry (useful if transient)
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Process relevant events
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;

          const email =
            session.customer_details?.email ||
            session.metadata?.customerEmail ||
            null;

          const customerName =
            session.customer_details?.name ||
            session.metadata?.customerName ||
            '';

          const itemId =
            session.metadata?.itemId || session.metadata?.tourId || '';

          const itemName =
            session.metadata?.itemName ||
            (itemId ? `Booking ${itemId}` : 'Booking');

          const quantity = Number(session.metadata?.quantity || 1);
          const date = session.metadata?.date || '';
          const amountTotal = session.amount_total || 0; // cents
          const currency = session.currency || 'usd';
          const bookingRef = session.id;
          const appBaseUrl = process.env.APP_BASE_URL || '';

          try {
            // TODO (idempotent): Persist booking in DB using bookingRef/session.id as unique key.

            // Send confirmation email if available
            if (email) {
              const html = bookingConfirmedTemplate({
                customerName,
                itemName,
                itemId,
                quantity,
                date,
                currency,
                amountTotal,
                bookingRef,
                appBaseUrl,
              });

              await sendMail({
                to: email,
                subject: 'Your 28 Degrees West booking is confirmed',
                html,
              });

              if (process.env.BCC_BOOKINGS_EMAIL) {
                await sendMail({
                  to: process.env.BCC_BOOKINGS_EMAIL,
                  subject: `Booking confirmed: ${bookingRef} — ${itemName}`,
                  html,
                });
              }
            }

            console.log(
              '✔️  Checkout completed processed:',
              bookingRef,
              '->',
              email || 'no-email'
            );
          } catch (postErr) {
            // Don’t fail the webhook acknowledgement if side-effects fail.
            console.error('Post-payment processing failed:', postErr);
          }
          break;
        }

        case 'payment_intent.succeeded': {
          const pi = event.data.object;
          console.log('PaymentIntent succeeded:', pi.id);
          break;
        }

        case 'checkout.session.async_payment_succeeded': {
          const session = event.data.object;
          console.log('Async payment succeeded:', session.id);
          break;
        }

        case 'checkout.session.expired':
        case 'checkout.session.async_payment_failed': {
          const session = event.data.object;
          console.warn('Checkout did not complete:', event.type, session.id);
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Acknowledge receipt
      return res.json({ received: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      // 500 causes Stripe to retry; use only for genuine failures after verification.
      return res.status(500).send('Webhook handler error');
    }
  }
);

export default router;

