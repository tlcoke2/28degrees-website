// server.js — non-blocking startup for Railway (ESM)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { createServer } from 'http';

// --- Models (for bootstrapping admin)
import User from './src/models/User.model.js';

// --- Routers (ensure filenames are correct)
import paymentsRouter from './src/routes/payment.routes.js';     // normal payment routes (NO webhook here)
import catalogRouter from './src/routes/catalog.routes.js';
import bookingsRouter from './src/routes/booking.routes.js';
import { stripeWebhookHandler } from './src/routes/payment.webhook.js'; // webhook-only handler

// --- Lazy imports (won’t block boot)
let errorHandler, logger, apiRoutes, aiRoutes, adminAuthRoutes;
(async () => {
  try {
    ({ errorHandler } = await import('./src/middleware/error.middleware.js'));
    const loggerModule = await import('./src/utils/logger.js').catch(() => null);
    logger = loggerModule?.default || console;
    ({ default: apiRoutes } = await import('./src/routes/api.routes.js'));
    ({ default: aiRoutes } = await import('./src/routes/ai.routes.js'));
    ({ default: adminAuthRoutes } = await import('./src/routes/admin/auth.routes.js'));
    logger.info?.('✅ Lazy modules loaded');
  } catch (err) {
    console.error('⚠️ Lazy load failure:', err);
  }
})();

// ----------------------------------------------------
// App & basics
// ----------------------------------------------------
const app = express();
const httpServer = createServer(app);
app.set('trust proxy', 1);

// Security headers (allow cross-origin API usage)
app.use(helmet({ crossOriginResourcePolicy: false }));

// -------- CORS (FIRST) --------
const allowed = new Set([
  'https://28degreeswest.com',
  'https://www.28degreeswest.com',
  'https://admin.28degreeswest.com',
]);
const corsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / same-origin
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    const ok = allowed.has(origin) || /^https:\/\/[a-z0-9-]+\.github\.io$/i.test(origin);
    return ok ? cb(null, true) : cb(new Error('CORS Not Allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// -------- Health endpoints (before anything else) --------
let dbReady = false;
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', dbReady, ts: new Date().toISOString() });
});
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok', dbReady, ts: new Date().toISOString() });
});

// -------- Stripe Webhook (RAW body) --------
// Must be BEFORE any express.json() middleware
app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// -------- Parsers & hardening for everything else --------
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(
  compression({
    filter: (req, res) => {
      const type = res.getHeader('Content-Type');
      if (type && String(type).includes('text/event-stream')) return false; // don’t compress SSE
      return compression.filter(req, res);
    },
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// -------- Root --------
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'success', message: '28 Degrees West API', dbReady });
});

// -------- Business routers --------
// Normal payments routes (JSON-parsed)
app.use('/api/v1/payments', paymentsRouter);

// Public catalog (gate on DB readiness)
app.use(
  '/api/v1/catalog',
  (req, res, next) => (dbReady ? next() : res.status(503).json({ error: 'Database not ready' })),
  catalogRouter
);

// Bookings (gate on DB readiness)
app.use(
  '/api/v1/bookings',
  (req, res, next) => (dbReady ? next() : res.status(503).json({ error: 'Database not ready' })),
  bookingsRouter
);

// Mount lazy routes even if not yet loaded; return 503 until ready
app.use('/api/v1/admin/auth', (req, res, next) =>
  adminAuthRoutes ? adminAuthRoutes(req, res, next) : res.status(503).json({ error: 'Auth routes unavailable' })
);
app.use('/api/v1/ai', (req, res, next) =>
  aiRoutes ? aiRoutes(req, res, next) : res.status(503).json({ error: 'AI routes unavailable' })
);
app.use('/api/v1', (req, res, next) =>
  apiRoutes ? apiRoutes(req, res, next) : res.status(503).json({ error: 'API routes unavailable' })
);

// -------- 404 & errors --------
app.all('*', (req, res) => {
  res.status(404).json({ status: 'fail', message: `Can't find ${req.originalUrl}` });
});
app.use((err, req, res, next) => {
  (logger || console).error?.('🔥 Error:', err);
  if (errorHandler) return errorHandler(err, req, res, next);
  res.status(500).json({ error: 'Internal server error' });
});

// ----------------------------------------------------
// Start server immediately; connect DB in background
// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  (logger || console).info?.(
    `🚀 Server listening on :${PORT} (env=${process.env.NODE_ENV || 'development'})`
  );
  connectMongo(); // Kick off DB connect without blocking readiness
});

// -------- DB connect (non-blocking with retry) --------
async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    (logger || console).error?.('❌ MONGODB_URI is not set');
    return;
  }
  try {
    (logger || console).info?.('🔍 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    // Seed/ensure default admin as soon as DB is online
    await ensureDefaultAdmin();

    dbReady = true;
    (logger || console).info?.('✅ MongoDB connected');
  } catch (err) {
    dbReady = false;
    (logger || console).error?.('❌ MongoDB connection failed:', err);
    setTimeout(connectMongo, 5000); // retry
  }
}

/**
 * Ensure a default Administrator exists.
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD env vars.
 * - Creates the admin if missing
 * - Promotes the existing user at that email to role 'admin'
 * This empowers the admin to update/remove all site content wherever
 * your routers use `authorize('admin')`.
 */
async function ensureDefaultAdmin() {
  try {
    const emailEnv = process.env.ADMIN_EMAIL;
    const passwordEnv = process.env.ADMIN_PASSWORD;

    if (!emailEnv || !passwordEnv) {
      (logger || console).warn?.('⚠️  Skipping admin bootstrap: ADMIN_EMAIL or ADMIN_PASSWORD not set');
      return;
    }

    const email = String(emailEnv).trim().toLowerCase();
    let admin = await User.findOne({ email }).select('_id role');

    if (!admin) {
      admin = await User.create({
        name: 'Administrator',
        email,
        password: passwordEnv,
        passwordConfirm: passwordEnv, // required by schema
        role: 'admin',
        active: true,
      });
      (logger || console).info?.(`👑 Default admin created: ${email}`);
    } else if (admin.role !== 'admin') {
      await User.updateOne({ _id: admin._id }, { $set: { role: 'admin', active: true } });
      (logger || console).info?.(`👑 Existing user promoted to admin: ${email}`);
    } else {
      (logger || console).info?.(`✅ Admin present: ${email}`);
    }
  } catch (e) {
    (logger || console).error?.('❌ Failed to ensure default admin:', e);
  }
}

// -------- Hard crashes → log (don’t silently die) --------
process.on('unhandledRejection', (err) => {
  (logger || console).error?.('UNHANDLED REJECTION 💥', err);
});
process.on('uncaughtException', (err) => {
  (logger || console).error?.('UNCAUGHT EXCEPTION 💥', err);
});

export default app;


