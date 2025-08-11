// server.js — Production-ready for Railway & GitHub Pages (ESM)

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './src/config/database.js';

// Routers that must be available early
import paymentsRouter from './src/routes/payment.routes.js';
import bookingsRouter from './src/routes/booking.routes.js';
import catalogRouter from './src/routes/catalog.routes.js';

// ----------------------------------------------------
// Paths & env
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env if present (Railway injects env automatically)
dotenv.config();

// ----------------------------------------------------
// App & server
// ----------------------------------------------------
const app = express();
const httpServer = createServer(app);

// Trust reverse proxies (Railway / Cloudflare)
app.set('trust proxy', 1);
connectDB();
// ----------------------------------------------------
// Dynamic imports (non-blocking startup)
// ----------------------------------------------------
let errorHandler, logger, apiRoutes, aiRoutes, adminAuthRoutes;
try {
  // middleware
  ({ errorHandler } = await import('./src/middleware/error.middleware.js'));

  // logger (your custom util). Fallback to console if not present
  const loggerModule = await import('./src/utils/logger.js').catch(() => null);
  logger = loggerModule?.default || console;

  // core routes
  ({ default: apiRoutes } = await import('./src/routes/api.routes.js'));

  // new: AI streaming + admin auth
  ({ default: aiRoutes } = await import('./src/routes/ai.routes.js'));
  ({ default: adminAuthRoutes } = await import('./src/routes/admin/auth.routes.js'));

  logger.info?.('✅ Core modules loaded successfully');
} catch (err) {
  console.error('❌ Failed to load core modules:', err);
  process.exit(1);
}

// ----------------------------------------------------
// Sentry (optional)
// ----------------------------------------------------
try {
  if (process.env.SENTRY_DSN) {
    const { initSentry } = await import('./src/utils/sentry.js');
    initSentry();
    logger.info?.('🛰️  Sentry initialized');
  } else {
    logger.info?.('ℹ️ Sentry not configured');
  }
} catch (err) {
  logger.warn?.('⚠️ Sentry init failed: ' + err.message);
}

// ----------------------------------------------------
// WebSocket (optional)
// ----------------------------------------------------
try {
  const { initWebSocket } = await import('./src/services/websocket.service.js');
  initWebSocket(httpServer);
  logger.info?.('✅ WebSocket service initialized');
} catch (err) {
  logger.warn?.('⚠️ WebSocket service failed: ' + err.message);
}

// ----------------------------------------------------
// Security & global middleware (order matters)
// ----------------------------------------------------
app.use(helmet());

/**
 * CORS:
 * - Allow your production domains
 * - Allow GH Pages (your org or repo page)
 * - Allow localhost in non-production
 */
const prodAllowed = [
  'https://28degreeswest.com',
  'https://www.28degreeswest.com',
  'https://admin.28degreeswest.com',
  // Add your GH Pages origin explicitly if used, e.g.:
  // 'https://trillion25.github.io'
];

const corsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    // Allow same-origin & curl/no-origin requests
    if (!origin) return cb(null, true);

    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      // In dev, allow anything
      return cb(null, true);
    }

    // In prod, allow if in the allowlist or a *.github.io page you explicitly trust
    const allowed =
      prodAllowed.includes(origin) ||
      /https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin);

    return allowed ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
};
app.use(cors(corsOptions));

/**
 * IMPORTANT: Mount the payments router BEFORE any body parser,
 * so its `/webhook` route (which uses express.raw) can verify signatures.
 * CORS is already applied above, so /payments has CORS headers too.
 */
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/catalog', catalogRouter);

// Now JSON/urlencoded parsers for the rest of the app
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitize & harden
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Compression, but skip for SSE so streaming works
app.use(
  compression({
    filter: (req, res) => {
      const type = res.getHeader('Content-Type');
      if (type && String(type).includes('text/event-stream')) return false;
      return compression.filter(req, res);
    },
  })
);

// Rate limit (after trust proxy!)
app.use(
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  })
);

// ----------------------------------------------------
// Health checks
// ----------------------------------------------------
app.get(['/health', '/api/v1/health'], (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ----------------------------------------------------
// Root (optional)
// ----------------------------------------------------
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: '28 Degrees West API root',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ----------------------------------------------------
// Business Routers
// ----------------------------------------------------
// User/admin auth
app.use('/api/v1/admin/auth', adminAuthRoutes);

// AI streaming (SSE endpoint and POST alternative)
app.use('/api/v1/ai', aiRoutes);

// Primary API
app.use('/api/v1', apiRoutes);

// Bookings (requires JSON parser, so mounted after parsers)
app.use('/api/v1/bookings', bookingsRouter);

// 404
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error?.('🔥 Error:', err);
  errorHandler(err, req, res, next);
});

// ----------------------------------------------------
// DB & server start
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not set');

    logger.info?.('🔍 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      // Modern Mongoose (v7+) — no deprecated flags
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info?.('✅ Connected to MongoDB');

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info?.(`🚀 Server running at http://0.0.0.0:${PORT}`);
      logger.info?.(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error?.('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = (signal) => {
  logger.info?.(`📴 Received ${signal}. Shutting down gracefully...`);
  httpServer.close(() => {
    mongoose.connection.close(false, () => {
      logger.info?.('✅ HTTP server & DB connections closed.');
      process.exit(0);
    });
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error?.('UNHANDLED REJECTION 💥:', err);
  process.exit(1);
});

startServer();

export default app;

