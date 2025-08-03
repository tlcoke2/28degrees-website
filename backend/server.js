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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import with dynamic paths
const errorHandler = (await import(join(__dirname, 'src', 'middleware', 'error.middleware.js'))).errorHandler;
const logger = (await import(join(__dirname, 'src', 'utils', 'logger.js'))).logger;

// Import API routes
let apiRoutes;
try {
  apiRoutes = (await import(join(__dirname, 'src', 'routes', 'api.routes.js'))).default;
  console.log('✅ API routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load API routes:', error);
  process.exit(1);
}

// Enhanced startup logging
console.log('🚀 Starting 28 Degrees Backend Server...');
console.log(`📅 ${new Date().toISOString()}`);
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Node Version: ${process.version}`);
console.log(`📁 Current Directory: ${process.cwd()}`);

// Load environment variables
console.log('🔍 Loading environment variables...');
dotenv.config();

// Log important environment variables (without sensitive values)
const logEnvVars = ['NODE_ENV', 'PORT', 'MONGODB_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
console.log('⚙️  Environment Variables:');
logEnvVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${varName}: ${value ? '***' + value.slice(-4) : 'Not set'}`);
});

// Initialize Sentry (optional)
try {
  console.log('🔧 Initializing Sentry...');
  // Check if Sentry DSN is configured
  if (process.env.SENTRY_DSN) {
    const { initSentry } = await import('./src/utils/sentry.js');
    initSentry();
    console.log('✅ Sentry initialized');
  } else {
    console.log('ℹ️ Sentry DSN not configured, skipping Sentry initialization');
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Sentry (optional):', error.message);
}

// Create Express app
console.log('🚀 Creating Express app...');
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
console.log('🔌 Initializing Socket.IO...');
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
  process.exit(1);
}

// Initialize WebSocket service
try {
  console.log('🔌 Initializing WebSocket service...');
  new WebSocketService(io);
  console.log('✅ WebSocket service initialized');
} catch (error) {
  console.error('❌ Failed to initialize WebSocket service:', error);
}

// Set security HTTP headers
console.log('🔒 Setting security headers...');
try {
  app.use(helmet());
  console.log('✅ Security headers set');
} catch (error) {
  console.error('❌ Failed to set security headers:', error);
}

// Enable CORS
console.log('🌐 Configuring CORS...');
try {
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://28degreeswest.com', 'https://www.28degreeswest.com']
      : '*',
    credentials: true
  };
  app.use(cors(corsOptions));
  console.log('✅ CORS configured');
} catch (error) {
  console.error('❌ Failed to configure CORS:', error);
}

// Rate limiting
console.log('⏱️  Configuring rate limiting...');
try {
  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour!',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);
  console.log('✅ Rate limiting configured');
} catch (error) {
  console.error('❌ Failed to configure rate limiting:', error);
}

// Body parser
console.log('📦 Configuring body parser...');
try {
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());
  console.log('✅ Body parser configured');
} catch (error) {
  console.error('❌ Failed to configure body parser:', error);
}

// Security middleware
console.log('🛡️  Configuring security middleware...');
try {
  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());
  
  // Data sanitization against XSS
  app.use(xss());
  
  // Prevent parameter pollution
  app.use(hpp({
    whitelist: [
      'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
    ]
  }));
  
  console.log('✅ Security middleware configured');
} catch (error) {
  console.error('❌ Failed to configure security middleware:', error);
}

// Compression
console.log('🗜️  Configuring compression...');
try {
  app.use(compression());
  console.log('✅ Compression configured');
} catch (error) {
  console.error('❌ Failed to configure compression:', error);
}

// Routes
console.log('🛣️  Configuring routes...');
try {
  app.use('/api/v1', apiRoutes);
  console.log('✅ Routes configured');
} catch (error) {
  console.error('❌ Failed to configure routes:', error);
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  console.log('🏗️  Configuring production static file serving...');
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const staticPath = join(__dirname, '../client/dist');
    
    console.log(`📂 Static files path: ${staticPath}`);
    
    // Serve static files
    app.use(express.static(staticPath));
    
    // Handle SPA
    app.get('*', (req, res) => {
      console.log(`📤 Serving SPA for: ${req.originalUrl}`);
      res.sendFile(join(staticPath, 'index.html'));
    });
    
    console.log('✅ Production static file serving configured');
  } catch (error) {
    console.error('❌ Failed to configure static file serving:', error);
  }
}

// Handle 404
app.all('*', (req, res, next) => {
  console.warn(`⚠️  404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  errorHandler(err, req, res, next);
});

// Get port from environment and store in Express
const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    console.log('🔍 Attempting to connect to MongoDB...');
    console.log(`🔗 MongoDB URI: ${process.env.MONGODB_URI ? '***' + process.env.MONGODB_URI.slice(-20) : 'Not set'}`);
    
    const dbOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
      connectTimeoutMS: 10000, // 10 seconds timeout
    };
    
    await mongoose.connect(process.env.MONGODB_URI, dbOptions);
    
    // Verify the connection
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.once('open', () => {
      console.log('✅ Connected to MongoDB successfully');
      console.log(`   - Host: ${db.host}`);
      console.log(`   - Port: ${db.port}`);
      console.log(`   - Database: ${db.name}`);
    });
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 http://0.0.0.0:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 MongoDB connected: ${mongoose.connection.host}`);
    });
    
    // Store server instance for graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Start the server
startServer();

export default app;
