import mongoose from 'mongoose';

const CATALOG_TYPES = ['tour', 'event', 'vip', 'product'];

const CatalogItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: CATALOG_TYPES,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      maxlength: 4000,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      default: 'usd',
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 3,
    },
    // Optional fields for richer UIs
    images: [{ type: String }],       // absolute URLs
    duration: { type: String },       // e.g. "Half Day", "Full Day"
    date: { type: Date },             // for events
    inventory: { type: Number },      // for products, null = not tracked
    active: { type: Boolean, default: true, index: true },

    // free-form extra data
    meta: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Helpful indexes (compound for faster queries)
CatalogItemSchema.index({ active: 1, type: 1, priceCents: 1 });
CatalogItemSchema.index({ name: 'text', description: 'text' });

// Safe JSON output
CatalogItemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

// Auto-generate slug if not provided
CatalogItemSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 180);
  }
  next();
});

export default mongoose.model('CatalogItem', CatalogItemSchema);
export { CATALOG_TYPES };
