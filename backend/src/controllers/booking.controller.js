// src/controllers/booking.controller.js
import Stripe from 'stripe';
import Tour from '../models/Tour.model.js';
import Booking from '../models/Booking.model.js';
import User from '../models/User.model.js';
import AppError from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

/* -------------------------------------------------------------------------- */
/*                                LIST / READ                                 */
/* -------------------------------------------------------------------------- */

// @desc    Get all bookings (admin)
// @route   GET /api/v1/bookings
// @access  Private/Admin
export const getAllBookings = catchAsync(async (_req, res) => {
  const bookings = await Booking.find().sort('-createdAt').lean();
  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
});

// @desc    Get my bookings (matches by user id OR email)
// @route   GET /api/v1/bookings/my-bookings
// @access  Private
export const getMyBookings = catchAsync(async (req, res) => {
  const filter = {
    $or: [{ user: req.user.id }, { email: req.user.email }],
  };
  const bookings = await Booking.find(filter)
    .sort('-createdAt')
    .lean();

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: { bookings },
  });
});

// @desc    Get single booking (owner or admin)
// @route   GET /api/v1/bookings/:id
// @access  Private
export const getBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).lean();
  if (!booking) return next(new AppError('No booking found with that ID', 404));

  const isOwner =
    (booking.user && String(booking.user) === String(req.user.id)) ||
    (booking.email && booking.email === req.user.email);

  if (req.user.role !== 'admin' && !isOwner) {
    return next(new AppError('Not authorized to view this booking', 403));
  }

  res.status(200).json({ status: 'success', data: { booking } });
});

/* -------------------------------------------------------------------------- */
/*                           LEGACY CHECKOUT ENDPOINTS                        */
/* -------------------------------------------------------------------------- */

// These flows are now handled by /api/v1/payments/checkout-session and webhook.
// Keep stubs for backward compatibility; return 410 Gone with guidance.

// @route   POST /api/v1/bookings/checkout-session/:tourId
export const getCheckoutSession = catchAsync(async (_req, res) => {
  res
    .status(410)
    .json({
      status: 'fail',
      error:
        'Deprecated. Use POST /api/v1/payments/checkout-session instead.',
    });
});

// @route   POST /api/v1/bookings/webhook-checkout
export const webhookCheckout = catchAsync(async (_req, res) => {
  res
    .status(410)
    .json({
      status: 'fail',
      error:
        'Deprecated. Stripe webhooks are handled at /api/v1/payments/webhook.',
    });
});

/* -------------------------------------------------------------------------- */
/*                                    CRUD                                    */
/* -------------------------------------------------------------------------- */

// @desc    Create new booking (admin)
// @route   POST /api/v1/bookings
// @access  Private/Admin
export const createBooking = catchAsync(async (req, res, next) => {
  const {
    tour,            // optional legacy ObjectId
    user,            // optional legacy ObjectId
    participants,    // optional legacy count
    startDate,       // optional legacy Date
    price,           // optional legacy major-unit price
    email,           // for Stripe-only bookings without user id
    customerName,
    customerPhone,
    itemId,          // preferred: catalog/tour id
    itemName,
    quantity,        // preferred
    currency,        // preferred (defaults to USD)
    totalCents,      // preferred amount in cents
    metadata,        // any extra info
    status,          // optional status override
    paymentIntentId, // optional if already captured
    stripeSessionId, // optional if creating from session
  } = req.body || {};

  // If a legacy tour id was provided, fetch details to enrich defaults
  let tourDoc = null;
  if (tour) {
    tourDoc = await Tour.findById(tour).select('name price currency').lean();
    if (!tourDoc) return next(new AppError('No tour found with that ID', 404));
  }

  // If a legacy user id was provided, ensure it exists
  if (user) {
    const userDoc = await User.findById(user).select('_id').lean();
    if (!userDoc) return next(new AppError('No user found with that ID', 404));
  }

  // Optional availability check (legacy helper)
  if (tour && startDate) {
    const taken = await Booking.isTourBooked(tour, startDate);
    if (taken) {
      return next(
        new AppError('The tour is already booked for the selected date', 400)
      );
    }
  }

  // Derive amounts
  const qty = Number.isFinite(Number(quantity)) ? Math.max(1, Number(quantity)) : (participants ? Number(participants) : 1);
  const unitMajor =
    typeof price === 'number'
      ? price
      : tourDoc?.price ?? 0;
  const amountCents =
    Number.isFinite(Number(totalCents))
      ? Number(totalCents)
      : Math.round((unitMajor || 0) * 100) * (qty || 1);

  const doc = await Booking.create({
    // Stripe-first fields
    stripeSessionId: stripeSessionId || undefined,
    paymentIntentId: paymentIntentId || undefined,
    email: email || undefined,
    customerName: customerName || undefined,
    customerPhone: customerPhone || undefined,
    itemId: itemId || (tour ? String(tour) : undefined),
    itemName: itemName || tourDoc?.name || undefined,
    quantity: qty,
    date: startDate ? undefined : req.body?.date || undefined, // keep legacy/startDate below

    totalCents: amountCents,
    currency: (currency || tourDoc?.currency || 'USD').toLowerCase(),

    status: status || (paymentIntentId ? 'paid' : 'pending'),
    metadata: metadata || {},

    // Legacy compatibility
    tour: tour || undefined,
    user: user || undefined,
    price: typeof price === 'number' ? price : undefined, // legacy major units
    participants: participants || qty,
    startDate: startDate || undefined,
  });

  res.status(201).json({ status: 'success', data: { booking: doc } });
});

// @desc    Update booking (admin)
// @route   PATCH /api/v1/bookings/:id
// @access  Private/Admin
export const updateBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!booking) return next(new AppError('No booking found with that ID', 404));
  res.status(200).json({ status: 'success', data: { booking } });
});

// @desc    Cancel booking (owner or admin); refunds if payment_intent present
// @route   PATCH /api/v1/bookings/:id/cancel
// @access  Private
export const cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError('No booking found with that ID', 404));

  const isOwner =
    (booking.user && String(booking.user) === String(req.user.id)) ||
    (booking.email && booking.email === req.user.email);

  if (req.user.role !== 'admin' && !isOwner) {
    return next(new AppError('Not authorized to cancel this booking', 403));
  }

  // If legacy startDate exists and is in the past, block cancellation
  if (booking.startDate && new Date(booking.startDate) < new Date()) {
    return next(new AppError('Cannot cancel a booking that has already started', 400));
  }

  // Refund if we have a Stripe Payment Intent
  if (booking.paymentIntentId && process.env.STRIPE_SECRET_KEY) {
    await stripe.refunds.create({ payment_intent: booking.paymentIntentId });
  }

  booking.status = 'canceled'; // normalize spelling
  await booking.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', data: { booking } });
});

// @desc    Delete booking (admin)
// @route   DELETE /api/v1/bookings/:id
// @access  Private/Admin
export const deleteBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) return next(new AppError('No booking found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});

/* -------------------------------------------------------------------------- */
/*                                   STATS                                    */
/* -------------------------------------------------------------------------- */

// @desc    Get booking stats (paid)
// @route   GET /api/v1/bookings/booking-stats
// @access  Private/Admin
export const getBookingStats = catchAsync(async (_req, res) => {
  // Aggregate by month on paid bookings
  const agg = await Booking.aggregate([
    { $match: { status: 'paid' } },
    {
      $addFields: {
        _totalCents: {
          $cond: [
            { $and: [{ $ne: ['$totalCents', null] }, { $gt: ['$totalCents', 0] }] },
            '$totalCents',
            { $multiply: [{ $ifNull: ['$price', 0] }, 100] }, // fallback to legacy price (major → cents)
          ],
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        numBookings: { $sum: 1 },
        totalCents: { $sum: '$_totalCents' },
        avgCents: { $avg: '$_totalCents' },
        minCents: { $min: '$_totalCents' },
        maxCents: { $max: '$_totalCents' },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        year: '$_id.year',
        numBookings: 1,
        totalRevenue: { $divide: ['$totalCents', 100] },
        avgPrice: { $divide: ['$avgCents', 100] },
        minPrice: { $divide: ['$minCents', 100] },
        maxPrice: { $divide: ['$maxCents', 100] },
      },
    },
    { $sort: { year: 1, month: 1 } },
  ]);

  res.status(200).json({ status: 'success', data: { stats: agg } });
});
