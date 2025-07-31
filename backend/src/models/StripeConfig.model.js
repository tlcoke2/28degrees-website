import mongoose from 'mongoose';
import validator from 'validator';
import crypto from 'crypto';

const stripeConfigSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false,
    required: [true, 'Activation status is required'],
  },
  publishableKey: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if the field is provided
        if (!v) return true;
        return v.startsWith('pk_');
      },
      message: props => `${props.value} is not a valid publishable key`
    },
    set: function(v) {
      return v ? v.trim() : v;
    }
  },
  secretKey: {
    type: String,
    trim: true,
    select: false, // Don't return this field by default
    validate: {
      validator: function(v) {
        // Only validate if the field is provided
        if (!v) return true;
        return v.startsWith('sk_');
      },
      message: props => `${props.value} is not a valid secret key`
    },
    set: function(v) {
      return v ? v.trim() : v;
    }
  },
  webhookSecret: {
    type: String,
    trim: true,
    select: false,
    validate: {
      validator: function(v) {
        // Only validate if the field is provided
        if (!v) return true;
        return v.startsWith('whsec_');
      },
      message: props => `${props.value} is not a valid webhook secret`
    },
    set: function(v) {
      return v ? v.trim() : v;
    }
  },
  commissionRate: {
    type: Number,
    default: 0,
    min: [0, 'Commission rate cannot be negative'],
    max: [100, 'Commission rate cannot exceed 100%'],
    set: function(v) {
      // Round to 2 decimal places
      return parseFloat(v.toFixed(2));
    }
  },
  currency: {
    type: String,
    default: 'USD',
    enum: {
      values: ['USD', 'GBP', 'EUR', 'JMD'],
      message: 'Currency must be one of: USD, GBP, EUR, JMD'
    },
    uppercase: true,
    trim: true
  },
  lastTested: {
    type: Date,
    default: null
  },
  testStatus: {
    type: String,
    enum: ['not_tested', 'success', 'failed'],
    default: 'not_tested'
  },
  testMessage: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  isTestMode: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
stripeConfigSchema.index({ isActive: 1 });
stripeConfigSchema.index({ 'metadata.tenantId': 1 });

// Middleware to handle update timestamps
stripeConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // If this is a new document, set createdBy if not set
  if (this.isNew && !this.createdBy) {
    this.createdBy = this.updatedBy;
  }
  
  // Validate that required fields are present when isActive is true
  if (this.isActive) {
    if (!this.publishableKey || !this.secretKey) {
      const err = new Error('Publishable key and secret key are required when activating Stripe');
      return next(err);
    }
  }
  
  next();
});

// Static method to get the active configuration
stripeConfigSchema.statics.getActiveConfig = async function() {
  return this.findOne({ isActive: true })
    .select('+secretKey +webhookSecret')
    .lean();
};

// Instance method to mask sensitive data
stripeConfigSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Always remove sensitive data
  delete obj.secretKey;
  delete obj.webhookSecret;
  
  // Mask publishable key (show first 8 and last 4 characters)
  if (obj.publishableKey) {
    const visibleChars = 4;
    const masked = obj.publishableKey.substring(0, visibleChars) + 
                  '*'.repeat(Math.max(0, obj.publishableKey.length - visibleChars * 2)) +
                  obj.publishableKey.substring(obj.publishableKey.length - visibleChars);
    obj.publishableKey = masked;
  }
  
  return obj;
};

// Instance method to test the Stripe connection
stripeConfigSchema.methods.testConnection = async function() {
  try {
    if (!this.secretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    
    const stripe = new (require('stripe'))(this.secretKey);
    await stripe.balance.retrieve();
    
    this.testStatus = 'success';
    this.testMessage = 'Connection successful';
  } catch (error) {
    this.testStatus = 'failed';
    this.testMessage = error.message || 'Connection failed';
    throw error;
  } finally {
    this.lastTested = new Date();
    await this.save();
  }
};

// Virtual for formatted commission rate
stripeConfigSchema.virtual('formattedCommissionRate').get(function() {
  return `${this.commissionRate}%`;
});

// Virtual for currency symbol
stripeConfigSchema.virtual('currencySymbol').get(function() {
  const symbols = {
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
    'JMD': 'J$'
  };
  return symbols[this.currency] || this.currency;
});

// Export the model
const StripeConfig = mongoose.model('StripeConfig', stripeConfigSchema);

export default StripeConfig;
