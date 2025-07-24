// Test utilities for API testing
import { createRequire } from 'module';
import express from 'express';
import { connect, closeDatabase, clearDatabase } from './test-setup.js';

const require = createRequire(import.meta.url);

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '90d';
process.env.JWT_COOKIE_EXPIRES_IN = '90';

// Helper to create a test app with routes
async function createTestApp() {
  try {
    // Connect to the in-memory database
    await connect();
    await clearDatabase();
    
    // Create a new express app
    const app = express();
    
    // Apply middleware
    app.use(express.json());
    
    // Import and apply routes
    const routes = (await import('../src/routes/index.js')).default;
    app.use('/', routes);
    
    // Create a supertest request instance
    const request = require('supertest');
    
    // Cleanup function
    const close = async () => {
      try {
        await clearDatabase();
        await closeDatabase();
      } catch (error) {
        console.error('Error during test cleanup:', error);
        throw error;
      }
    };
    
    return {
      app,
      request: request(app), // Create a supertest agent for the app
      close
    };
  } catch (error) {
    console.error('Error creating test app:', error);
    throw error;
  }
}

export { createTestApp };
