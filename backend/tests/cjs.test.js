// Test using CommonJS require syntax
const request = require('supertest');
const app = require('../server');

describe('CJS API Test', () => {
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
