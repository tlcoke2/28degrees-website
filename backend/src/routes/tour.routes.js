import express from 'express';
import {
  aliasTopTours,
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  checkTourAvailability,
} from '../controllers/tour.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Aliasing
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

// Aggregation pipeline routes
router.route('/tour-stats').get(getTourStats);
router.route('/monthly-plan/:year').get(protect, authorize('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// Geospatial queries
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin);
router.route('/distances/:latlng/unit/:unit').get(getDistances);

// Check tour availability
router.route('/:id/check-availability').get(checkTourAvailability);

// Standard CRUD routes
router
  .route('/')
  .get(getAllTours)
  .post(protect, authorize('admin', 'lead-guide'), createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(protect, authorize('admin', 'lead-guide'), updateTour)
  .delete(protect, authorize('admin', 'lead-guide'), deleteTour);

export default router;
