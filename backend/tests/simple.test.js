import request from 'supertest';
import { createServer } from 'http';
import app from '../server.js';

// Create a test server instance
const server = createServer(app);

describe('Simple API Test', () => {
  it('should return 404 for non-existent route', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Not Found');
  });

  it('should return API status', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.message).toContain('API is running');
  });
});
