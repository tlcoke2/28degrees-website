import express from 'express';
import {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  setTourUserIds,
} from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(protect);

// Nested routes
// POST /tours/234fad4/reviews
// GET /tours/234fad4/reviews
// GET /tours/234fad4/reviews/94888fda

router
  .route('/')
  .get(getAllReviews)
  .post(authorize('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(authorize('user', 'admin'), updateReview)
  .delete(authorize('user', 'admin'), deleteReview);

export default router;
