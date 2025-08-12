// src/models/StripeConfig.js
import mongoose from 'mongoose';
import Stripe from 'stripe';

const stripeConfigSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: false,
      required: [true, 'Activation status is required'],
    },

    publishableKey: {
      type: String,
      trim: true,
      validate: {
        validator(v) {
          if (!v) return true;
          return v.startsWith('pk_');
        },
        message: (props) => `${props.value} is not a valid Stripe publishable key`,
      },
      set(v) {
        return v ? v.trim() : v;
      },
    },

    secretKey: {
      type: String,
      trim: true,
      select: false, // never returned by default
      validate: {
        validator(v) {
          if (!v) return true;
          return v.startsWith('sk_');
        },
        message: (props) => `${props.value} is not a valid Stripe secret key`,
      },
      set(v) {
        return v ? v.trim() : v;
      },
    },

    webhookSecret: {
      type: String,
      trim: true,
      select: false,
      validate: {
        validator(v) {
          if (!v) return true;
          return v.startsWith('whsec_');
        },
        message: (props) => `${props.value} is not a valid Stripe webhook secret`,
      },
      set(v) {
        return v ? v.trim() : v;
      },
    },

    commissionRate: {
      type: Number,
      default: 0,
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100%'],
      set(v) {
        if (v == null) return v;
        const n = Number(v);
        return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
      },
    },

    currency: {
      type: String,
      default: 'USD',
      enum: {
        values: ['USD', 'GBP', 'EUR', 'JMD'],
        message: 'Currency must be one of: USD, GBP, EUR, JMD',
      },
      uppercase: true,
      trim: true,
    },

    lastTested: { type: Date, default: null },
    testStatus: {
      type: String,
      enum: ['not_tested', 'success', 'failed'],
      default: 'not_tested',
    },
    testMessage: { type: String, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    isTestMode: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ------------------------------- Indexes -------------------------------- */
// Only one active config at a time
stripeConfigSchema.index(
  { isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);
// Tenant-aware lookups (if you multi-tenant)
stripeConfigSchema.index({ 'metadata.tenantId': 1 });

/* ------------------------------ Middleware ------------------------------- */
// Ensure required keys exist when activating; run before validation
stripeConfigSchema.pre('validate', function (next) {
  if (this.isActive) {
    if (!this.publishableKey || !this.secretKey || !this.webhookSecret) {
      return next(
        new Error('publishableKey, secretKey, and webhookSecret are required when activating Stripe')
      );
    }
  }

  // If creating and createdBy is unset, default it to updatedBy (if provided)
  if (this.isNew && !this.createdBy && this.updatedBy) {
    this.createdBy = this.updatedBy;
  }

  next();
});

/* --------------------------------- Statics -------------------------------- */
stripeConfigSchema.statics.getActiveConfig = async function () {
  return this.findOne({ isActive: true }).select('+secretKey +webhookSecret').lean();
};

/* -------------------------------- Methods -------------------------------- */
// Mask sensitive data on JSON serialization
stripeConfigSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });

  // Always remove sensitive fields
  delete obj.secretKey;
  delete obj.webhookSecret;

  // Mask publishableKey (show first 4 and last 4)
  if (obj.publishableKey && typeof obj.publishableKey === 'string') {
    const visible = 4;
    const s = obj.publishableKey;
    obj.publishableKey =
      s.slice(0, visible) + '*'.repeat(Math.max(0, s.length - visible * 2)) + s.slice(-visible);
  }

  return obj;
};

// Live test against Stripe API (uses secretKey). Fetches secrets if not selected.
stripeConfigSchema.methods.testConnection = async function () {
  try {
    // Ensure we have secrets even if current doc was loaded without them
    if (!this.secretKey || !this.webhookSecret) {
      const fresh = await this.constructor
        .findById(this._id)
        .select('+secretKey +webhookSecret')
        .lean();
      this.secretKey = fresh?.secretKey;
      this.webhookSecret = fresh?.webhookSecret;
    }

    if (!this.secretKey) throw new Error('Stripe secret key is not configured');

    const stripe = new Stripe(this.secretKey, { apiVersion: '2024-06-20' });
    await stripe.balance.retrieve();

    this.testStatus = 'success';
    this.testMessage = 'Connection successful';
  } catch (error) {
    this.testStatus = 'failed';
    this.testMessage = error?.message || 'Connection failed';
    throw error;
  } finally {
    this.lastTested = new Date();
    await this.save(); // persists testStatus/testMessage/lastTested
  }
};

/* -------------------------------- Virtuals -------------------------------- */
stripeConfigSchema.virtual('formattedCommissionRate').get(function () {
  return `${this.commissionRate}%`;
});

stripeConfigSchema.virtual('currencySymbol').get(function () {
  const symbols = { USD: '$', GBP: '£', EUR: '€', JMD: 'J$' };
  return symbols[this.currency] || this.currency;
});

/* --------------------------------- Export -------------------------------- */
export default mongoose.models.StripeConfig ||
  mongoose.model('StripeConfig', stripeConfigSchema);
