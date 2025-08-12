// src/routes/user.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';

import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} from '../controllers/user.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ----------------------------- Helpers ----------------------------- */

const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300,                 // adjust based on expected traffic
  standardHeaders: true,
  legacyHeaders: false,
});

function validate(checks) {
  return [
    ...checks,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => ({ field: e.path, msg: e.msg })),
        });
      }
      next();
    },
  ];
}

const idCheck = validate([
  param('id').isMongoId().withMessage('Invalid user id'),
]);

const adminCreateChecks = validate([
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional().isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  body('phone').optional().isString().isLength({ max: 40 }).withMessage('Phone too long'),
]);

const adminUpdateChecks = validate([
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  body('phone').optional().isString().isLength({ max: 40 }).withMessage('Phone too long'),
]);

/* ----------------------- Auth: protect everything ----------------------- */

router.use(protect);

/* ----------------------- Self-service profile routes -------------------- */

// GET /api/v1/users/me
router.get('/me', getMe, getUser);

// PATCH /api/v1/users/update-me  (alias: /updateMe)
// Photo upload is only allowed on self-update to avoid privilege escalation via admin routes.
router.patch(
  ['/update-me', '/updateMe'],
  uploadUserPhoto,
  resizeUserPhoto,
  updateMe
);

// DELETE /api/v1/users/delete-me  (alias: /deleteMe)
router.delete(['/delete-me', '/deleteMe'], deleteMe);

/* ---------------------------- Admin-only CRUD --------------------------- */

router.use(authorize('admin'), adminLimiter);

// GET/POST /api/v1/users
router
  .route('/')
  .get(getAllUsers)
  .post(adminCreateChecks, createUser);

// GET/PATCH/DELETE /api/v1/users/:id
router
  .route('/:id')
  .get(idCheck, getUser)
  .patch(idCheck, adminUpdateChecks, updateUser)
  .delete(idCheck, deleteUser);

export default router;
