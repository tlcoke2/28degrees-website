import express from 'express';
import {
  getAllBookings,
  getMyBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
  getCheckoutSession,
  webhookCheckout,
  cancelBooking,
  getBookingStats,
} from '../controllers/booking.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Webhook route - must come before body parser
router.post('/webhook-checkout', express.raw({ type: 'application/json' }), webhookCheckout);

// Protect all routes after this middleware
router.use(protect);

// User routes
router.get('/my-bookings', getMyBookings);
router.post('/checkout-session/:tourId', getCheckoutSession);
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

// Stats route
router.get('/booking-stats', getBookingStats);

export default router;
