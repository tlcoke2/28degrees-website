// server.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { Server } from 'socket.io';

// Setup directory resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Convert paths to file URLs for dynamic imports (Linux safe)
const errorHandlerPath = pathToFileURL(join(__dirname, 'src', 'middleware', 'error.middleware.js')).href;
const loggerPath = pathToFileURL(join(__dirname, 'src', 'utils', 'logger.js')).href;
const apiRoutesPath = pathToFileURL(join(__dirname, 'src', 'routes', 'api.routes.js')).href;

let errorHandler, logger, apiRoutes;
try {
  ({ errorHandler } = await import(errorHandlerPath));
  ({ logger } = await import(loggerPath));
  apiRoutes = (await import(apiRoutesPath)).default;
  console.log('✅ Core modules loaded successfully');
} catch (err) {
  console.error('❌ Failed to load core modules:', err);
  process.exit(1);
}

// Optional: Initialize Sentry (skip if not configured)
try {
  if (process.env.SENTRY_DSN) {
    const sentryPath = pathToFileURL(join(__dirname, 'src', 'utils', 'sentry.js')).href;
    const { initSentry } = await import(sentryPath);
    initSentry();
    console.log('✅ Sentry initialized');
  } else {
    console.log('ℹ️ Sentry not configured');
  }
} catch (err) {
  console.warn('⚠️ Sentry load error (optional):', err.message);
}

// App initialization
const app = express();
const httpServer = createServer(app);

// Socket.IO setup
let io;
try {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://28degreeswest.com', 'https://www.28degreeswest.com']
        : '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  console.log('✅ Socket.IO initialized');
} catch (err) {
  console.error('❌ Socket.IO init failed:', err);
}

// Optional WebSocket service
try {
  const wsServicePath = pathToFileURL(join(__dirname, 'src', 'services', 'websocket.service.js')).href;
  const { WebSocketService } = await import(wsServicePath);
  new WebSocketService(io);
  console.log('✅ WebSocket service initialized');
} catch (err) {
  console.warn('⚠️ WebSocket service failed:', err.message);
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://28degreeswest.com', 'https://www.28degreeswest.com']
    : '*',
  credentials: true
}));
app.use(rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests. Try again in an hour.'
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['duration', 'ratingsAverage', 'price'] }));
app.use(compression());

// API routes
app.use('/api/v1', apiRoutes);

// Serve frontend (SPA) if in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = join(__dirname, 'dist'); // Ensure frontend built to /dist
  app.use(express.static(staticPath));
  app.get('*', (req, res) => res.sendFile(join(staticPath, 'index.html')));
}

// 404 fallback
app.all('*', (req, res) => {
  console.warn(`⚠️ Route not found: ${req.originalUrl}`);
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server.`
  });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Error:', err);
  errorHandler(err, req, res, next);
});

// MongoDB + start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};

// Unhandled Promise Rejection
process.on('unhandledRejection', err => {
  console.error('❗ Unhandled Rejection:', err);
  process.exit(1);
});

startServer();

export default app;

