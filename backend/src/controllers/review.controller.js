// src/controllers/review.controller.js
import { catchAsync } from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import Review from '../models/Review.model.js';

/* ----------------------------- Helpers ----------------------------- */

function pick(obj = {}, fields = []) {
  const out = {};
  for (const k of fields) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) {
      out[k] = obj[k];
    }
  }
  return out;
}

function isOwner(review, user) {
  return review?.user && String(review.user) === String(user.id);
}

/* ------------------------------ Controllers ------------------------------ */

// @desc    Get all reviews (optionally for a specific tour)
// @route   GET /api/v1/reviews
// @route   GET /api/v1/tours/:tourId/reviews
// @access  Public
export const getAllReviews = catchAsync(async (req, res) => {
  const filter = req.params.tourId ? { tour: req.params.tourId } : {};
  const reviews = await Review.find(filter).lean();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
export const getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id).lean();
  if (!review) return next(new AppError('No review found with that ID', 404));

  res.status(200).json({ status: 'success', data: { review } });
});

// @desc    Create new review (one per user per tour; unique index enforces it)
// @route   POST /api/v1/reviews
// @route   POST /api/v1/tours/:tourId/reviews
// @access  Private
export const createReview = catchAsync(async (req, res, next) => {
  // Allow nested routes and ensure author is the authenticated user
  const body = {
    review: req.body.review,
    rating: req.body.rating,
    tour: req.body.tour || req.params.tourId,
    user: req.user.id,
  };

  if (!body.tour) return next(new AppError('Tour id is required', 400));

  try {
    const newReview = await Review.create(body);
    return res.status(201).json({ status: 'success', data: { review: newReview } });
  } catch (err) {
    // Handle duplicate review (unique {tour,user} index)
    if (err?.code === 11000) {
      return next(new AppError('You have already reviewed this tour', 409));
    }
    throw err;
  }
});

// @desc    Update review (owner or admin)
// @route   PATCH /api/v1/reviews/:id
// @access  Private
export const updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('No review found with that ID', 404));

  if (req.user.role !== 'admin' && !isOwner(review, req.user)) {
    return next(new AppError('Not authorized to update this review', 403));
  }

  const updates = pick(req.body, ['review', 'rating']);
  const updated = await Review.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { review: updated } });
});

// @desc    Delete review (owner or admin)
// @route   DELETE /api/v1/reviews/:id
// @access  Private
export const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('No review found with that ID', 404));

  if (req.user.role !== 'admin' && !isOwner(review, req.user)) {
    return next(new AppError('Not authorized to delete this review', 403));
  }

  await Review.findByIdAndDelete(req.params.id);
  res.status(204).json({ status: 'success', data: null });
});

/* ----------------------- Nested route convenience ------------------------ */
// Middleware to set tour and user IDs for nested routes
export const setTourUserIds = (req, _res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
