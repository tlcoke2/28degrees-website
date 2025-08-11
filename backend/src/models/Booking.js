// ./src/models/Booking.js
import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    // Stripe identifiers
    stripeSessionId: { type: String, required: true, index: true, unique: true },
    paymentIntentId: { type: String },

    // Customer / contact
    email: { type: String, index: true },
    customerName: { type: String },
    customerPhone: { type: String },

    // Item / product
    itemId: { type: String, index: true },       // e.g., tourId
    itemName: { type: String },

    // Booking details
    quantity: { type: Number, default: 1, min: 1 },
    date: { type: String }, // keep as string (yyyy-mm-dd) if that's what you collect; switch to Date if desired

    // Money
    totalCents: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'usd' },

    // Status lifecycle
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired', 'failed', 'refunded', 'canceled'],
      default: 'pending',
      index: true,
    },

    // Extra metadata (safe subset only)
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Helpful compound index (optional)
BookingSchema.index({ email: 1, createdAt: -1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
