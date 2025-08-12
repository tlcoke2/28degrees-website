// src/models/Tour.model.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [100, 'A tour name must have ≤ 100 characters'],
      minlength: [10, 'A tour name must have ≥ 10 characters'],
    },
    slug: { type: String, index: true, unique: true, sparse: true },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
      min: [1, 'Duration must be at least 1'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
      min: [1, 'Group size must be at least 1'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: v => Math.round(v * 10) / 10, // keep one decimal
    },
    ratingsQuantity: { type: Number, default: 0 },

    // Monetary fields (store major units; expose minor via virtual)
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
      min: [0, 'Price must be ≥ 0'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // Only reliable on create/save; ensure runValidators on updates
          if (val == null) return true;
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    currency: { type: String, default: 'USD', uppercase: true },

    summary: { type: String, trim: true, required: [true, 'A tour must have a description'] },
    description: { type: String, trim: true },

    imageCover: { type: String, required: [true, 'A tour must have a cover image'] },
    images: [{ type: String }],

    createdAt: { type: Date, default: Date.now, select: false },
    startDates: [{ type: Date }],

    secretTour: { type: Boolean, default: false },

    // GeoJSON start location
    startLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        validate: {
          validator: v => Array.isArray(v) && v.length === 2,
          message: 'startLocation.coordinates must be [lng, lat]',
        },
      },
      address: String,
      description: String,
    },

    // Additional locations
    locations: [
      {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }, // [lng, lat]
        address: String,
        description: String,
        day: Number,
      },
    ],

    // Guide references
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ----------------------------- Indexes ----------------------------- */
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 }, { unique: true, sparse: true });
tourSchema.index({ startLocation: '2dsphere' });

/* ----------------------------- Virtuals ---------------------------- */
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Price in minor units for frontend convenience
tourSchema.virtual('priceCents').get(function () {
  if (typeof this.price !== 'number') return undefined;
  return Math.round(this.price * 100);
});

/* --------------------------- Document hooks ------------------------ */
tourSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

/* ---------------------------- Query hooks -------------------------- */
tourSchema.pre(/^find/, function (next) {
  // Hide secret tours by default
  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  // Populate guides (lightweight selection)
  this.populate({ path: 'guides', select: 'name email role' });
  next();
});

/* ------------------------- Aggregation hook ------------------------ */
tourSchema.pre('aggregate', function (next) {
  const pipeline = this.pipeline();
  // Do not inject match before $geoNear (must be first stage)
  const hasGeoNear = pipeline.length && Object.keys(pipeline[0])[0] === '$geoNear';
  if (!hasGeoNear) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  }
  next();
});

export default mongoose.models.Tour || mongoose.model('Tour', tourSchema);

