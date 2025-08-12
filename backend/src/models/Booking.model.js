// src/models/Booking.js
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    /* ---------- Stripe / payment-first fields ---------- */
    stripeSessionId: { type: String, index: true, unique: true, sparse: true }, // idempotency for webhooks
    paymentIntentId: { type: String, index: true, sparse: true },

    // Contact / customer (copied from Stripe metadata or customer_details)
    email: { type: String, index: true },
    customerName: { type: String },
    customerPhone: { type: String },

    // Item booked (tour/product identifier from your catalog)
    itemId: { type: String, index: true },   // e.g., tourId or SKU
    itemName: { type: String },

    // Quantities / dates (string date from UI; legacy Date field also supported below)
    quantity: { type: Number, default: 1, min: 1 },
    date: { type: String }, // 'YYYY-MM-DD' as sent by the frontend

    // Money
    totalCents: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'usd' },

    // Status lifecycle (union of legacy + Stripe states)
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired', 'failed', 'refunded', 'canceled', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },

    // Arbitrary extra info from the request/checkout session
    metadata: { type: mongoose.Schema.Types.Mixed },

    /* ---------- Legacy relations / compatibility ---------- */
    tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Legacy price (major units) kept for compatibility; prefer totalCents above
    price: { type: Number, min: 0 },

    // Legacy participation & schedule
    participants: { type: Number, min: 1 },
    startDate: { type: Date },

    // Legacy payment fields
    paymentMethod: { type: String, enum: ['credit_card', 'paypal', 'stripe'], default: 'stripe' },
    receiptUrl: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ------------------------------- Indexes --------------------------------- */

// Prevent duplicate Stripe upserts
// (unique + sparse so docs without session id are allowed)
BookingSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

// Prevent duplicate tour booking by the same user on the same date — only when all exist
BookingSchema.index(
  { tour: 1, user: 1, startDate: 1 },
  {
    unique: true,
    partialFilterExpression: { tour: { $exists: true }, user: { $exists: true }, startDate: { $exists: true } },
  }
);

/* ---------------------------- Auto-population ---------------------------- */

BookingSchema.pre(/^find/, function (next) {
  // Best-effort populate; cheap selects only
  this.populate({ path: 'user', select: 'name email role' }).populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

/* ------------------------------- Statics --------------------------------- */

// Check if a tour is already booked on a given calendar day (legacy helper)
BookingSchema.statics.isTourBooked = async function (tourId, startDate) {
  if (!tourId || !startDate) return false;
  const dayStart = new Date(startDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startDate);
  dayEnd.setHours(23, 59, 59, 999);

  const booking = await this.findOne({
    tour: tourId,
    startDate: { $gte: dayStart, $lt: dayEnd },
    status: { $nin: ['canceled', 'cancelled'] },
  }).lean();

  return !!booking;
};

/* ------------------------------ Pre-save hook ---------------------------- */
/**
 * Legacy price calculator (optional):
 * If legacy `tour` + `participants` are provided and `price` is not set,
 * you could derive `price` from Tour here. We avoid doing a DB round-trip
 * by default; the Stripe flow already sets `totalCents`.
 *
 * Uncomment if you want legacy auto-pricing:
 *
 * BookingSchema.pre('save', async function (next) {
 *   if (this.isNew && this.tour && this.participants && !this.price) {
 *     const Tour = mongoose.model('Tour');
 *     const tour = await Tour.findById(this.tour).select('price').lean();
 *     if (tour?.price) this.price = tour.price * this.participants;
 *   }
 *   next();
 * });
 */

/* --------------------------------- Export -------------------------------- */

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
