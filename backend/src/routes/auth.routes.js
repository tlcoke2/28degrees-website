// src/routes/auth.routes.js

import express from 'express';
import { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword, 
  updatePassword 
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Protected routes (require authentication)
router.use(protect);
router.get('/logout', logout);
router.patch('/updateMyPassword', updatePassword);

export default router;

