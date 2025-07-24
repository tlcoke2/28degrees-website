import helmet from 'helmet';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import { StatusCodes } from 'http-status-codes';
import AppError from '../utils/AppError.js';

/**
 * Set security HTTP headers using Helmet
 */
export const setSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
      ],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://res.cloudinary.com',
        'https://*.tiles.mapbox.com',
        'https://api.mapbox.com',
      ],
      connectSrc: [
        "'self'",
        'https://*.tiles.mapbox.com',
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://*.cloudinary.com',
        'https://api.stripe.com',
      ],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Stripe
});

/**
 * Prevent parameter pollution
 * Whitelist parameters that can be used in query strings
 */
export const preventParamPollution = hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price',
  ],
});

/**
 * Data sanitization against NoSQL query injection
 */
export const sanitizeMongoData = mongoSanitize();

/**
 * Data sanitization against XSS
 */
export const sanitizeXSS = xss();

/**
 * Limit the amount of data that comes in the request body
 */
export const limitBodySize = (req, res, next) => {
  // Limit to 10kb for JSON data
  if (req.headers['content-type'] === 'application/json') {
    const TEN_KB = 10 * 1024; // 10KB
    let data = '';
    
    req.on('data', (chunk) => {
      data += chunk;
      
      // If the data is too large, destroy the connection
      if (data.length > TEN_KB) {
        data = '';
        res.writeHead(StatusCodes.REQUEST_TOO_LONG, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'error',
          message: 'Request body too large. Maximum size is 10KB.',
        }));
        req.connection.destroy();
      }
    });
    
    req.on('end', () => {
      if (data) {
        try {
          req.body = JSON.parse(data);
        } catch (e) {
          return next(new AppError('Invalid JSON payload', StatusCodes.BAD_REQUEST));
        }
      }
      next();
    });
  } else {
    next();
  }
};

/**
 * Prevent CORS issues
 */
export const configureCors = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(StatusCodes.OK).json({});
  }
  
  next();
};

/**
 * Add security headers to responses
 */
export const addSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent content type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Set Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  
  next();
};
