// src/models/Review.model.js
import mongoose from 'mongoose';

const DEFAULT_AVG = 4.5;

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
      trim: true,
      minlength: [10, 'A review must be at least 10 characters'],
      maxlength: [1000, 'A review must be at most 1000 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
      index: true,
    },
  },
  {
    timestamps: true,                // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate reviews from the same user on the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/* ---------------------------- Auto-population ---------------------------- */
// Keep population lightweight to avoid large payloads
reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

/* ------------------------- Ratings aggregation --------------------------- */
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  if (!tourId) return;

  const stats = await this.aggregate([
    { $match: { tour: new mongoose.Types.ObjectId(tourId) } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  const payload =
    stats.length > 0
      ? { ratingsQuantity: stats[0].nRating, ratingsAverage: stats[0].avgRating }
      : { ratingsQuantity: 0, ratingsAverage: DEFAULT_AVG };

  // Best-effort update; don't throw if tour missing
  await mongoose.model('Tour').findByIdAndUpdate(tourId, payload, {
    new: false,
    runValidators: false,
  }).lean();
};

// Recompute ratings after create
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// Recompute ratings after update/delete via findOneAnd* operations
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }
});

export default mongoose.models.Review || mongoose.model('Review', reviewSchema);
