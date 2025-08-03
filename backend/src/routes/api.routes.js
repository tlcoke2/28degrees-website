import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import tourRoutes from './tour.routes';
import reviewRoutes from './review.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import stripeRoutes from './stripe.routes';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tours', tourRoutes);
router.use('/reviews', reviewRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/stripe', stripeRoutes);

// 404 handler for API routes
router.use('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

export default router;
