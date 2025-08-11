// ./src/routes/payment.webhook.js
// Expects to be mounted as raw in server.js:
// app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

import Stripe from 'stripe';
import Booking from '../models/Booking.js';
import { sendMail } from '../utils/mailer.js';
import { bookingConfirmedTemplate } from '../templates/email/booking-confirmed.js';

/** ----------------- Helpers ----------------- **/

function getEnv(name, { required = false } = {}) {
  const v = process.env[name];
  if (required && !v) throw new Error(`${name} is not defined`);
  return v;
}

function getStripeClient() {
  const key = getEnv('STRIPE_SECRET_KEY', { required: true });
  return new Stripe(key, {
    apiVersion: '2024-06-20',
    maxNetworkRetries: 3,
    timeout: 10000,
  });
}

/**
 * Idempotent upsert of a booking. If a booking with the same stripeSessionId already exists,
 * we DO NOT create a duplicate; we update its latest status/fields.
 */
async function upsertBookingFromSession(session, finalStatus = 'paid') {
  const email =
    session.customer_details?.email || session.metadata?.customerEmail || null;

  const customerName =
    session.customer_details?.name || session.metadata?.customerName || '';

  const customerPhone = session.metadata?.customerPhone || '';

  const itemId = session.metadata?.itemId || session.metadata?.tourId || '';

  const itemName =
    session.metadata?.itemName || (itemId ? `Booking ${itemId}` : 'Booking');

  const quantity = Number(session.metadata?.quantity || 1);
  const date = session.metadata?.date || '';
  const amountTotal = session.amount_total || 0; // cents
  const currency = (session.currency || 'usd').toLowerCase();

  const stripeSessionId = session.id;
  const paymentIntentId = session.payment_intent || undefined;

  // Upsert by unique stripeSessionId
  const update = {
    paymentIntentId,
    email,
    customerName,
    customerPhone,
    itemId,
    itemName,
    quantity,
    date,
    totalCents: amountTotal,
    currency,
    status: finalStatus,
    metadata: session.metadata || {},
  };

  // If document exists, update fields; if not, insert a new one with all fields.
  // setOnInsert ensures initial values are set on first insert.
  const booking = await Booking.findOneAndUpdate(
    { stripeSessionId },
    {
      $set: update,
      $setOnInsert: {
        stripeSessionId,
      },
    },
    { upsert: true, new: true }
  ).lean();

  return booking;
}

/** ----------------- Core Handler ----------------- **/

export async function stripeWebhookHandler(req, res) {
  // req.body is a Buffer due to express.raw in server.js
  try {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
      console.error('[Stripe] Missing stripe-signature header');
      return res.status(400).send('Missing Stripe signature');
    }

    const endpointSecret = getEnv('STRIPE_WEBHOOK_SECRET', { required: true });
    const stripe = getStripeClient();

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('[Stripe] Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        // 1) Persist/Update booking idempotently
        let booking;
        try {
          booking = await upsertBookingFromSession(session, 'paid');
        } catch (dbErr) {
          // Do not fail the webhook acknowledgement if DB write fails.
          console.error('[Stripe] Booking upsert failed:', dbErr);
        }

        // 2) Send confirmation email (best-effort)
        try {
          const email =
            session.customer_details?.email ||
            session.metadata?.customerEmail ||
            null;

          if (email) {
            const appBaseUrl = getEnv('APP_BASE_URL') || '';
            const html = bookingConfirmedTemplate({
              customerName:
                session.customer_details?.name ||
                session.metadata?.customerName ||
                '',
              itemName:
                session.metadata?.itemName ||
                (session.metadata?.itemId || session.metadata?.tourId
                  ? `Booking ${session.metadata?.itemId || session.metadata?.tourId}`
                  : 'Booking'),
              itemId: session.metadata?.itemId || session.metadata?.tourId || '',
              quantity: Number(session.metadata?.quantity || 1),
              date: session.metadata?.date || '',
              currency: (session.currency || 'usd').toLowerCase(),
              amountTotal: session.amount_total || 0,
              bookingRef: session.id,
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
                subject: `Booking confirmed: ${session.id} — ${
                  booking?.itemName || 'Booking'
                }`,
                html,
              });
            }
          }
        } catch (mailErr) {
          console.error('[Stripe] Email dispatch failed:', mailErr);
        }

        console.log('✔️ checkout.session.completed processed:', session.id);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        try {
          await upsertBookingFromSession(session, 'expired');
        } catch (dbErr) {
          console.error('[Stripe] Mark expired failed:', dbErr);
        }
        console.warn('⚠️ checkout.session.expired:', session.id);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        try {
          await upsertBookingFromSession(session, 'failed');
        } catch (dbErr) {
          console.error('[Stripe] Mark failed failed:', dbErr);
        }
        console.warn('⚠️ async_payment_failed:', session.id);
        break;
      }

      case 'payment_intent.succeeded': {
        // Optional: if you also support a PaymentIntent-only flow, you can convert it into a booking here.
        const pi = event.data.object;
        console.log('ℹ️ payment_intent.succeeded:', pi.id);
        break;
      }

      default:
        console.log(`(Stripe) Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[Stripe] Webhook handler error:', err);
    // 500 => Stripe will retry; only return 500 on genuine processing failures.
    return res.status(500).send('Webhook handler error');
  }
}
