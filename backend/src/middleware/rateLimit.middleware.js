import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import AppError from '../utils/AppError.js';

/**
 * Rate limiting middleware for login attempts
 * Limits each IP to 5 login requests per 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  handler: (req, res, next, options) => {
    throw new AppError(options.message, StatusCodes.TOO_MANY_REQUESTS);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * General API rate limiting
 * Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next, options) => {
    throw new AppError(options.message, StatusCodes.TOO_MANY_REQUESTS);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for password reset requests
 * Limits each IP to 3 password reset requests per hour
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: 'Too many password reset attempts, please try again later',
  handler: (req, res, next, options) => {
    throw new AppError(options.message, StatusCodes.TOO_MANY_REQUESTS);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for contact form submissions
 * Limits each IP to 10 submissions per day
 */
export const contactFormLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Limit each IP to 10 contact form submissions per day
  message: 'Too many contact form submissions, please try again tomorrow',
  handler: (req, res, next, options) => {
    throw new AppError(options.message, StatusCodes.TOO_MANY_REQUESTS);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting for payment processing
 * Limits each IP to 20 payment attempts per hour
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 payment attempts per hour
  message: 'Too many payment attempts, please try again later',
  handler: (req, res, next, options) => {
    throw new AppError(options.message, StatusCodes.TOO_MANY_REQUESTS);
  },
  standardHeaders: true,
  legacyHeaders: false,
});
