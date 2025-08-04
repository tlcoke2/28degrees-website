// server.js — Fully Production-Ready for Railway & GitHub Pages

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
import { dirname, join } from 'path';

// Setup __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.production') });

// ✅ Initialize Express and HTTP server before any awaits
const app = express();
const httpServer = createServer(app);

// ✅ Trust reverse proxy (required for Railway, rate-limit, etc.)
app.set('trust proxy', 1);

// ✅ Import dynamic modules
let errorHandler, logger, apiRoutes;
try {
  const errorModule = await import('./src/middleware/error.middleware.js');
  errorHandler = errorModule.errorHandler;

  const loggerModule = await import('./src/utils/logger.js');
  logger = loggerModule.default;

  const apiRoutesModule = await import('./src/routes/api.routes.js');
  apiRoutes = apiRoutesModule.default;

  console.log('✅ Core modules loaded successfully');
} catch (err) {
  console.error('❌ Failed to load core modules:', err);
  process.exit(1);
}

// ✅ Sentry Initialization (optional)
try {
  if (process.env.SENTRY_DSN) {
    const { initSentry } = await import('./src/utils/sentry.js');
    initSentry();
  } else {
    console.log('ℹ️ Sentry not configured');
  }
} catch (err) {
  console.warn('⚠️ Sentry init failed:', err.message);
}

// ✅ WebSocket Setup
try {
  const { initWebSocket } = await import('./src/services/websocket.service.js');
  initWebSocket(httpServer);
  console.log('✅ WebSocket service initialized');
} catch (err) {
  console.warn('⚠️ WebSocket service failed:', err.message);
}

// ✅ Security & Middleware Setup
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://28degreeswest.com',
        'https://www.28degreeswest.com',
        'https://admin.28degreeswest.com'
      ]
    : '*',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
}));

// ✅ Root route (GET /)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '28 Degrees West API root',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ✅ Primary API routes
app.use('/api/v1', apiRoutes);

// ✅ Fallback 404 route
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  errorHandler(err, req, res, next);
});

// ✅ Connect to MongoDB and Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to MongoDB');

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ✅ Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION 💥:', err);
  process.exit(1);
});

startServer();

export default app;
