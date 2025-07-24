import Tour from '../models/Tour.model.js';
import Booking from '../models/Booking.model.js';
import AppError from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Get all bookings
// @route   GET /api/v1/bookings
// @access  Private/Admin
export const getAllBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find().populate('user').populate('tour');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

// @desc    Get my bookings
// @route   GET /api/v1/bookings/my-bookings
// @access  Private
export const getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate({
      path: 'tour',
      select: 'name imageCover price duration',
    })
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  Private
export const getBooking = catchAsync(async (req, res, next) => {
  let query = Booking.findById(req.params.id);
  
  // If user is not admin, they can only see their own bookings
  if (req.user.role !== 'admin') {
    query = query.where('user').equals(req.user.id);
  }
  
  const booking = await query.populate('user').populate('tour');

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

// @desc    Create new booking
// @route   POST /api/v1/bookings/checkout-session/:tourId
// @access  Private
export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-bookings?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.28degreeswest.com/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      user: req.user._id,
      participants: req.body.participants || 1,
      startDate: req.body.startDate || new Date(),
    },
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// @desc    Create booking from webhook
// @route   POST /api/v1/bookings/webhook-checkout
// @access  Public
export const webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Create booking
    await Booking.create({
      tour: session.client_reference_id,
      user: session.metadata.user,
      price: session.amount_total / 100, // Convert back to dollars
      participants: parseInt(session.metadata.participants, 10),
      startDate: new Date(session.metadata.startDate),
      paymentIntentId: session.payment_intent,
      status: 'paid',
    });
  }

  res.status(200).json({ received: true });
});

// @desc    Create new booking (admin only)
// @route   POST /api/v1/bookings
// @access  Private/Admin
export const createBooking = catchAsync(async (req, res, next) => {
  const { tour, user, price, participants, startDate } = req.body;

  // Check if tour exists
  const tourExists = await Tour.findById(tour);
  if (!tourExists) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // Check if user exists
  const userExists = await User.findById(user);
  if (!userExists) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Check if the tour is available for the selected date
  const isAvailable = await Booking.isTourAvailable(
    tour,
    startDate,
    participants
  );

  if (!isAvailable) {
    return next(
      new AppError('The tour is not available for the selected date', 400)
    );
  }

  const booking = await Booking.create({
    tour,
    user,
    price: price || tourExists.price * participants,
    participants,
    startDate,
    status: 'paid',
  });

  res.status(201).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

// @desc    Update booking
// @route   PATCH /api/v1/bookings/:id
// @access  Private/Admin
export const updateBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

// @desc    Cancel booking
// @route   PATCH /api/v1/bookings/:id/cancel
// @access  Private
export const cancelBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!booking) {
    return next(
      new AppError('No booking found with that ID or not authorized', 404)
    );
  }

  // Check if booking can be cancelled (e.g., not in the past)
  if (new Date(booking.startDate) < new Date()) {
    return next(
      new AppError('Cannot cancel a booking that has already started', 400)
    );
  }

  // Process refund if payment was made
  if (booking.paymentIntentId) {
    // Create a refund
    await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
    });
  }

  // Update booking status
  booking.status = 'cancelled';
  await booking.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      booking,
    },
  });
});

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private/Admin
export const deleteBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) {
    return next(new AppError('No booking found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Get booking stats
// @route   GET /api/v1/bookings/booking-stats
// @access  Private/Admin
export const getBookingStats = catchAsync(async (req, res, next) => {
  const stats = await Booking.aggregate([
    {
      $match: { status: 'paid' },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        numBookings: { $sum: 1 },
        totalRevenue: { $sum: '$price' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
