// src/routes/admin/auth.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { protect } from '../../middleware/auth.middleware.js';
import {
  adminRegister,
  adminLogin,
  adminMe,
  adminLogout,
} from '../../controllers/admin/auth.controller.js';

const router = express.Router();

/* --------------------------- Middleware helpers --------------------------- */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                  // per IP in window
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

/* --------------------------------- Schemas -------------------------------- */

const registerChecks = validate([
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .isString()
    .withMessage('Password is required'),
  body('phone').optional().isString().isLength({ max: 40 }).withMessage('Phone is too long'),
  body('role').optional().isString().isIn(['user', 'admin']).withMessage('Invalid role'),
]);

const loginChecks = validate([
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
]);

/* --------------------------------- Routes --------------------------------- */

// POST /api/v1/admin/auth/register
router.post('/register', authLimiter, registerChecks, adminRegister);

// POST /api/v1/admin/auth/login
router.post('/login', authLimiter, loginChecks, adminLogin);

// GET /api/v1/admin/auth/me
router.get('/me', protect, adminMe);

// POST /api/v1/admin/auth/logout
router.post('/logout', protect, adminLogout);

export default router;


