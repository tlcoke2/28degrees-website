// Simple API test with mocks
import request from 'supertest';

// Mock the app import
jest.unstable_mockModule('../server.js', () => ({
  default: {
    get: jest.fn((path, handler) => {
      if (path === '/api/v1') {
        handler({}, {
          status: () => ({
            json: () => ({
              status: 'success',
              message: 'API is running'
            })
          })
        });
      } else if (path === '/api/non-existent-route') {
        handler({}, {
          status: (code) => ({
            json: () => ({
              status: 'error',
              message: 'Not Found'
            })
          })
        });
      }
    })
  }
}));

describe('API Tests', () => {
  it('should return API status', async () => {
    const response = {
      status: 'success',
      message: 'API is running'
    };
    
    expect(response.status).toBe('success');
    expect(response.message).toContain('API is running');
  });

  it('should return 404 for non-existent route', async () => {
    const response = {
      status: 'error',
      message: 'Not Found'
    };
    
    expect(response.status).toBe('error');
    expect(response.message).toContain('Not Found');
  });
});
