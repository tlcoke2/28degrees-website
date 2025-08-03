// src/routes/api.routes.js
import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import tourRoutes from './tour.routes.js';
import reviewRoutes from './review.routes.js';
import bookingRoutes from './booking.routes.js';
import paymentRoutes from './payment.routes.js';
import stripeRoutes from './stripe.routes.js';

const router = express.Router();

// ✅ Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ✅ Register API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tours', tourRoutes);
router.use('/reviews', reviewRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/stripe', stripeRoutes);

// ✅ 404 handler for undefined API endpoints
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

export default router;

