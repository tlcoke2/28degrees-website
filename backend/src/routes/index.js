import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import tourRoutes from './tour.routes.js';
import reviewRoutes from './review.routes.js';
import bookingRoutes from './booking.routes.js';

const router = Router();

// API routes
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/users', userRoutes);
router.use('/api/v1/tours', tourRoutes);
router.use('/api/v1/reviews', reviewRoutes);
router.use('/api/v1/bookings', bookingRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 404 route
router.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

export default router;
