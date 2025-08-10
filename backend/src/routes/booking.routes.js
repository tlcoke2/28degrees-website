import express from 'express';
import {
  getAllBookings,
  getMyBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
  getBookingStats,
} from '../controllers/booking.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// NOTE: No webhook or checkout routes here. Those live in /routes/payments.routes.js

// All booking routes require auth (adjust if you need public reads)
router.use(protect);

// User routes
router.get('/my-bookings', getMyBookings);
router.patch('/:id/cancel', cancelBooking);

// Admin routes
router.use(authorize('admin', 'lead-guide'));

router
  .route('/')
  .get(getAllBookings)
  .post(createBooking);

router
  .route('/:id')
  .get(getBooking)
  .patch(updateBooking)
  .delete(deleteBooking);

// Stats
router.get('/booking-stats', getBookingStats);

export default router;
