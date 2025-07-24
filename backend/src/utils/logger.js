import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '../../logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir);
}

// Create a write stream for request logs
const requestLogStream = createWriteStream(join(logsDir, 'requests.log'), { flags: 'a' });

// Create a write stream for error logs
const errorLogStream = createWriteStream(join(logsDir, 'errors.log'), { flags: 'a' });

// Custom token for request ID
morgan.token('id', (req) => req.id || '-');

// Custom token for request body (for POST, PUT, PATCH)
morgan.token('body', (req) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    return JSON.stringify(req.body);
  }
  return '-';
});

// Custom format function for request logging
const requestFormat = (tokens, req, res) => {
  const logData = {
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTime: `${tokens['response-time'](req, res)}ms`,
    ip: tokens['remote-addr'](req, res),
    userAgent: tokens['user-agent'](req, res),
    requestId: tokens.id(req, res),
    body: tokens.body(req, res),
  };

  return JSON.stringify(logData);
};

// Request logger middleware
export const requestLogger = morgan(requestFormat, {
  stream: requestLogStream,
  skip: (req) => req.originalUrl === '/health', // Skip health check requests
});

/**
 * Error logger utility
 * @param {Error} error - The error object
 * @param {string} source - The source of the error (e.g., 'auth', 'database')
 * @param {Object} meta - Additional metadata to log with the error
 */
export const errorLogger = (error, source = 'unknown', meta = {}) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const errorLog = {
    timestamp,
    level: 'error',
    source,
    name: error.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    ...meta,
  };

  // Log to error log file
  errorLogStream.write(JSON.stringify(errorLog) + '\n');

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('\x1b[31m', `[${timestamp}] ERROR (${source}):`, errorLog, '\x1b[0m');
  }
};

/**
 * Log an informational message
 * @param {string} message - The message to log
 * @param {string} source - The source of the log
 * @param {Object} meta - Additional metadata to log
 */
export const infoLogger = (message, source = 'app', meta = {}) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry = {
    timestamp,
    level: 'info',
    source,
    message,
    ...meta,
  };

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('\x1b[36m', `[${timestamp}] INFO (${source}):`, message, '\x1b[0m');
  }

  // In production, you might want to log to a file or external service
  if (process.env.NODE_ENV === 'production') {
    requestLogStream.write(JSON.stringify(logEntry) + '\n');
  }
};

/**
 * Log a warning message
 * @param {string} message - The warning message
 * @param {string} source - The source of the warning
 * @param {Object} meta - Additional metadata
 */
export const warnLogger = (message, source = 'app', meta = {}) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry = {
    timestamp,
    level: 'warn',
    source,
    message,
    ...meta,
  };

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn('\x1b[33m', `[${timestamp}] WARN (${source}):`, message, '\x1b[0m');
  }

  // In production, log to error log
  if (process.env.NODE_ENV === 'production') {
    errorLogStream.write(JSON.stringify(logEntry) + '\n');
  }
};

/**
 * Log database queries for debugging
 * @param {string} query - The database query
 * @param {number} duration - Query execution time in ms
 * @param {string} collection - The collection being queried
 */
export const queryLogger = (query, duration, collection) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    console.log('\x1b[35m', `[${timestamp}] DB QUERY (${collection}):`, {
      query,
      duration: `${duration}ms`,
    }, '\x1b[0m');
  }
};

export default {
  requestLogger,
  errorLogger,
  infoLogger,
  warnLogger,
  queryLogger,
};
