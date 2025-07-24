// API endpoint tests using our test utilities
import { jest } from '@jest/globals';
import { createTestApp } from './test-utils.js';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds

// Increase the default test timeout
jest.setTimeout(TEST_TIMEOUT);

describe('API Endpoints', () => {
  let testApp;
  let request;
  let close;

  // Setup test app before all tests
  beforeAll(async () => {
    const app = await createTestApp();
    testApp = app.app;
    request = app.request;
    close = app.close;
  });

  // Clean up after all tests
  afterAll(async () => {
    if (close) {
      await close();
    }
  });
  
  it('should return health check status', async () => {
    try {
      const res = await request.get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('API is running smoothly');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.environment).toBeDefined();
    } catch (error) {
      console.error('Error in health check test:', error);
      throw error;
    }
  });
  
  it('should return 404 for non-existent API route', async () => {
    try {
      const res = await request.get('/api/v1/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body).toBeDefined();
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain("Can't find /api/v1/non-existent-route on this server!");
    } catch (error) {
      console.error('Error in non-existent API route test:', error);
      throw error;
    }
  });
  
  it('should return 404 for non-existent route', async () => {
    try {
      const res = await request.get('/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body).toBeDefined();
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toContain("Can't find /non-existent-route on this server!");
    } catch (error) {
      console.error('Error in non-existent route test:', error);
      throw error;
    }
  });
});
