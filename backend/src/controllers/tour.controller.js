// src/controllers/tour.controller.js
import Tour from '../models/Tour.model.js';
import Booking from '../models/Booking.model.js';
import AppError from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours
 * Public – list tours with filtering, sorting, field selection, pagination
 * -------------------------------------------------------------------------- */
export const getAllTours = catchAsync(async (req, res, next) => {
  // 1) Filtering
  const queryObj = { ...req.query };
  const excluded = ['page', 'sort', 'limit', 'fields'];
  excluded.forEach((k) => delete queryObj[k]);

  // 2) Advanced filtering (gte, gt, lte, lt)
  let filterStr = JSON.stringify(queryObj);
  filterStr = filterStr.replace(/\b(gte|gt|lte|lt)\b/g, (m) => `$${m}`);
  const filter = JSON.parse(filterStr);

  // 3) Base query
  let query = Tour.find(filter);

  // 4) Sorting
  if (req.query.sort) {
    const sortBy = String(req.query.sort).split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // 5) Field limiting
  if (req.query.fields) {
    const fields = String(req.query.fields).split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // 6) Pagination
  const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
  const limit = Math.max(parseInt(String(req.query.limit || '10'), 10), 1);
  const skip = (page - 1) * limit;

  const total = await Tour.countDocuments(filter);
  if (skip >= total && total !== 0) {
    return next(new AppError('This page does not exist', 404));
  }

  query = query.skip(skip).limit(limit);

  // Execute
  const tours = await query.lean();

  res.status(200).json({
    status: 'success',
    results: tours.length,
    pagination: { total, page, limit },
    data: { tours },
  });
});

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours/:id
 * Public – single tour with reviews populated (as per model middleware)
 * -------------------------------------------------------------------------- */
export const getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews').lean();
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  res.status(200).json({ status: 'success', data: { tour } });
});

/* ----------------------------------------------------------------------------
 * POST /api/v1/tours
 * Private/Admin – create tour
 * -------------------------------------------------------------------------- */
export const createTour = catchAsync(async (req, res) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({ status: 'success', data: { tour: newTour } });
});

/* ----------------------------------------------------------------------------
 * PATCH /api/v1/tours/:id
 * Private/Admin – update tour
 * -------------------------------------------------------------------------- */
export const updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  res.status(200).json({ status: 'success', data: { tour } });
});

/* ----------------------------------------------------------------------------
 * DELETE /api/v1/tours/:id
 * Private/Admin – delete tour
 * -------------------------------------------------------------------------- */
export const deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  res.status(204).json({ status: 'success', data: null });
});

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours/tour-stats
 * Private/Admin – aggregate stats for highly-rated tours
 * -------------------------------------------------------------------------- */
export const getTourStats = catchAsync(async (_req, res) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
  ]);

  res.status(200).json({ status: 'success', data: { stats } });
});

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours/monthly-plan/:year
 * Private/Admin – starts per month
 * -------------------------------------------------------------------------- */
export const getMonthlyPlan = catchAsync(async (req, res) => {
  const year = parseInt(String(req.params.year), 10);

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTourStarts: -1 } },
    { $limit: 12 },
  ]);

  res.status(200).json({ status: 'success', results: plan.length, data: { plan } });
});

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit
 * Public – tours within radius of a point
 * -------------------------------------------------------------------------- */
export const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  if (!latlng || !latlng.includes(',')) {
    return next(new AppError('Please provide latitude and longitude as "lat,lng"', 400));
  }

  const [latStr, lngStr] = latlng.split(',');
  const lat = Number(latStr);
  const lng = Number(lngStr);
  const dist = Number(distance);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(dist)) {
    return next(new AppError('Invalid coordinates or distance', 400));
  }

  // radians: distance / Earth radius
  const radius = unit === 'mi' ? dist / 3963.2 : dist / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  }).lean();

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours/distances/:latlng/unit/:unit
 * Public – compute distances from a point
 * -------------------------------------------------------------------------- */
export const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  if (!latlng || !latlng.includes(',')) {
    return next(new AppError('Please provide latitude and longitude as "lat,lng"', 400));
    }

  const [latStr, lngStr] = latlng.split(',');
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return next(new AppError('Invalid coordinates', 400));
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    { $project: { distance: 1, name: 1 } },
  ]);

  res.status(200).json({ status: 'success', data: { distances } });
});

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours/:id/check-availability?date=YYYY-MM-DD&participants=#
 * Public – checks availability considering both legacy and Stripe-era bookings
 * -------------------------------------------------------------------------- */
export const checkTourAvailability = catchAsync(async (req, res, next) => {
  const { date, participants } = req.query;
  const tour = await Tour.findById(req.params.id).select('maxGroupSize name').lean();
  if (!tour) return next(new AppError('No tour found with that ID', 404));

  if (!date) return next(new AppError('date is required (YYYY-MM-DD)', 400));
  const reqCount = Math.max(1, Number(participants || 1));
  if (!Number.isFinite(reqCount)) return next(new AppError('participants must be a number', 400));
  if (tour.maxGroupSize && reqCount > tour.maxGroupSize) {
    return res.status(200).json({ status: 'success', data: { available: false, reason: 'exceeds capacity' } });
  }

  // Legacy: bookings that use startDate (Date) + participants
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const legacyAgg = await Booking.aggregate([
    {
      $match: {
        tour: tour._id,
        startDate: { $gte: dayStart, $lt: dayEnd },
        status: { $nin: ['canceled', 'cancelled'] },
      },
    },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$participants', 0] } } } },
  ]);

  const legacyTotal = legacyAgg?.[0]?.total || 0;

  // Stripe-era: bookings using itemId + date (string "YYYY-MM-DD") + quantity
  const stripeAgg = await Booking.aggregate([
    {
      $match: {
        itemId: String(tour._id),
        date: String(date),
        status: { $nin: ['canceled', 'cancelled'] },
      },
    },
    { $group: { _id: null, total: { $sum: { $ifNull: ['$quantity', 0] } } } },
  ]);

  const stripeTotal = stripeAgg?.[0]?.total || 0;

  const used = legacyTotal + stripeTotal;
  const capacity = tour.maxGroupSize || Infinity;
  const available = used + reqCount <= capacity;

  res.status(200).json({
    status: 'success',
    data: {
      available,
      capacity,
      alreadyBooked: used,
      canAccept: Math.max(0, capacity - used),
    },
  });
});

/* ----------------------------------------------------------------------------
 * GET /api/v1/tours/top-5-cheap
 * Public – alias builder middleware
 * -------------------------------------------------------------------------- */
export const aliasTopTours = (req, _res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
