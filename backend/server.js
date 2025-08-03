import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io'; // ✅ FIXED: Socket.IO Server import

// Get directory context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Helper function to handle dynamic imports with proper file URL conversion
const importFromPath = async (path) => {
  try {
    // Convert Windows path to file URL if needed
    const fileUrl = path.startsWith('file://') ? path : 
      `file://${path.replace(/\\/g, '/').replace(/^\//, '')}`;
    return await import(fileUrl);
  } catch (error) {
    console.error(`❌ Failed to import from path: ${path}`, error);
    throw error;
  }
};

// Import middleware and utilities dynamically
let errorHandler, logger;
try {
  const errorModule = await importFromPath(join(__dirname, 'src', 'middleware', 'error.middleware.js'));
  errorHandler = errorModule.errorHandler;
  
  const loggerModule = await importFromPath(join(__dirname, 'src', 'utils', 'logger.js'));
  logger = loggerModule.logger;
  
  console.log('✅ Core middleware and utilities loaded successfully');
} catch (error) {
  console.error('❌ Failed to load core modules:', error);
  process.exit(1);
}

// Load API Routes
let apiRoutes;
try {
  const apiModule = await importFromPath(join(__dirname, 'src', 'routes', 'api.routes.js'));
  apiRoutes = apiModule.default;
  console.log('✅ API routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load API routes:', error);
  process.exit(1);
}

// Enhanced logging
console.log('🚀 Starting 28 Degrees Backend Server...');
console.log(`📅 ${new Date().toISOString()}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Node Version: ${process.version}`);
console.log(`📁 Working Directory: ${process.cwd()}`);
console.log(`📂 __dirname: ${__dirname}`);
console.log(`📂 __filename: ${__filename}`);

// Directory content logging
try {
  const fs = await import('fs');
  const files = fs.readdirSync(__dirname);
  console.log('📂 Directory contents:', files);

  const srcPath = join(__dirname, 'src');
  if (fs.existsSync(srcPath)) {
    const srcFiles = fs.readdirSync(srcPath);
    console.log('📂 src/ contents:', srcFiles);
  } else {
    console.error('❌ src/ directory not found!');
  }
} catch (error) {
  console.error('❌ Error reading directories:', error);
}

// Masked environment variable logging
const logEnvVars = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
console.log('⚙️ Environment Variables:');
logEnvVars.forEach(key => {
  const val = process.env[key];
  console.log(`   ${key}: ${val ? '***' + val.slice(-4) : 'Not set'}`);
});

// Optional Sentry setup
try {
  if (process.env.SENTRY_DSN) {
    const { initSentry } = await import('./src/utils/sentry.js');
    initSentry();
    console.log('✅ Sentry initialized');
  } else {
    console.log('ℹ️ Sentry not configured');
  }
} catch (error) {
  console.warn('⚠️ Sentry setup failed:', error.message);
}

// Create Express and HTTP server
const app = express();
const httpServer = createServer(app);

// ✅ Initialize Socket.IO
let io;
try {
  const ioConfig = {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://28degreeswest.com', 'https://www.28degreeswest.com']
        : '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  };

  io = new Server(httpServer, ioConfig);
  console.log('✅ Socket.IO initialized');
} catch (error) {
  console.error('❌ Failed to initialize Socket.IO:', error);
}

// WebSocket Service
try {
  const { WebSocketService } = await import('./src/services/websocket.service.js');
  new WebSocketService(io);
  console.log('✅ WebSocket service initialized');
} catch (error) {
  console.error('❌ WebSocket service failed:', error);
}

// Middleware configuration
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
  message: 'Too many requests from this IP, try again in an hour.'
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));
app.use(compression());

// Route mounting
app.use('/api/v1', apiRoutes);

// 404 handler
app.all('*', (req, res) => {
  console.warn(`⚠️ 404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Error middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  errorHandler(err, req, res, next);
});

// MongoDB + Server Init
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const db = mongoose.connection;
    db.once('open', () => {
      console.log(`✅ Connected to MongoDB: ${db.name} @ ${db.host}`);
    });

    const server = httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down...');
      server.close(() => console.log('💤 Server closed'));
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION 💥', err.name, err.message);
  process.exit(1);
});

startServer();
export default app;

