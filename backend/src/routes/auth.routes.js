// src/routes/auth.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';

import {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
} from '../controllers/auth.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ----------------------------- Helpers ----------------------------- */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // adjust per your traffic profile
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

/* --------------------------- Validators --------------------------- */

const registerChecks = validate([
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isString().isLength({ max: 40 }).withMessage('Phone is too long'),
]);

const loginChecks = validate([
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
]);

const forgotChecks = validate([
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
]);

const resetChecks = validate([
  param('token').isString().notEmpty().withMessage('Reset token is required'),
  body('password').isString().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
]);

const updatePwChecks = validate([
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
]);

/* ----------------------------- Routes ----------------------------- */
/**
 * Public routes
 * Kebab-case is preferred; camelCase aliases kept for backward compatibility.
 */

// POST /api/v1/auth/register
router.post(['/register'], authLimiter, registerChecks, register);

// POST /api/v1/auth/login
router.post(['/login'], authLimiter, loginChecks, login);

// POST /api/v1/auth/forgot-password  (alias: /forgotPassword)
router.post(['/forgot-password', '/forgotPassword'], authLimiter, forgotChecks, forgotPassword);

// PATCH /api/v1/auth/reset-password/:token  (alias: /resetPassword/:token)
router.patch(['/reset-password/:token', '/resetPassword/:token'], authLimiter, resetChecks, resetPassword);

/**
 * Protected routes
 * Everything below requires a valid auth token.
 */
router.use(protect);

// POST /api/v1/auth/logout  (alias: GET /logout kept for legacy callers)
router.post(['/logout'], logout);
// Legacy GET (optional; remove if you want POST-only)
router.get(['/logout'], logout);

// PATCH /api/v1/auth/update-my-password  (alias: /updateMyPassword)
router.patch(['/update-my-password', '/updateMyPassword'], updatePwChecks, updatePassword);

export default router;


