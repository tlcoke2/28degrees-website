import { Server } from 'socket.io';
import logger from '../utils/logger.js';

let io;

/**
 * Initialize WebSocket service
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
export const initWebSocket = (server) => {
  try {
    // Initialize Socket.IO with CORS configuration
    io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [
              'https://28degreeswest.com',
              'https://www.28degreeswest.com',
              'https://admin.28degreeswest.com'
            ]
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Enable HTTP long-polling as fallback
      transports: ['websocket', 'polling']
    });

    // Connection event
    io.on('connection', (socket) => {
      logger.info(`⚡ Client connected: ${socket.id}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
    });

    logger.info('✅ WebSocket service initialized');
    return io;
  } catch (error) {
    logger.error('❌ Failed to initialize WebSocket service:', error);
    throw error;
  }
};

/**
 * Get the WebSocket server instance
 * @returns {Object} Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
};

export default {
  initWebSocket,
  getIO
};
