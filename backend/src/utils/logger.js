// backend/utils/logger.js

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

const requestLogStream = createWriteStream(join(logsDir, 'requests.log'), { flags: 'a' });
const errorLogStream = createWriteStream(join(logsDir, 'errors.log'), { flags: 'a' });

// === Morgan Request Logger ===
morgan.token('id', (req) => req.id || '-');
morgan.token('body', (req) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    return JSON.stringify(req.body);
  }
  return '-';
});

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

export const requestLogger = morgan(requestFormat, {
  stream: requestLogStream,
  skip: (req) => req.originalUrl === '/health',
});

// === Logger Methods ===

function error(error, source = 'unknown', meta = {}) {
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

  errorLogStream.write(JSON.stringify(errorLog) + '\n');

  if (process.env.NODE_ENV !== 'production') {
    console.error('\x1b[31m', `[${timestamp}] ERROR (${source}):`, errorLog, '\x1b[0m');
  }
}

function info(message, source = 'app', meta = {}) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry = {
    timestamp,
    level: 'info',
    source,
    message,
    ...meta,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('\x1b[36m', `[${timestamp}] INFO (${source}):`, message, '\x1b[0m');
  }

  if (process.env.NODE_ENV === 'production') {
    requestLogStream.write(JSON.stringify(logEntry) + '\n');
  }
}

function warn(message, source = 'app', meta = {}) {
  const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const logEntry = {
    timestamp,
    level: 'warn',
    source,
    message,
    ...meta,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.warn('\x1b[33m', `[${timestamp}] WARN (${source}):`, message, '\x1b[0m');
  }

  if (process.env.NODE_ENV === 'production') {
    errorLogStream.write(JSON.stringify(logEntry) + '\n');
  }
}

function query(query, duration, collection) {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    console.log('\x1b[35m', `[${timestamp}] DB QUERY (${collection}):`, {
      query,
      duration: `${duration}ms`,
    }, '\x1b[0m');
  }
}

// === Unified Export ===
const logger = {
  requestLogger,
  error,
  info,
  warn,
  query,
};

export default logger;
