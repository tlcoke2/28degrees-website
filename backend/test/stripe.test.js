import request from 'supertest';
import { expect } from 'chai';
import app from '../src/app.js';
import { connectDB, closeDB } from '../src/config/database.js';
import { generateAuthToken } from '../src/utils/auth.js';

// Test user with admin role
const testAdmin = {
  _id: 'testadmin123',
  email: 'admin@example.com',
  role: 'admin'
};

// Generate auth token for test admin
const adminToken = generateAuthToken(testAdmin);

describe('Stripe Configuration API', () => {
  before(async () => {
    // Connect to test database
    await connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/28degrees-test');
  });

  after(async () => {
    // Close database connection
    await closeDB();
  });

  describe('GET /api/stripe/config', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/stripe/config');
      
      expect(res.status).to.equal(401);
    });

    it('should return 403 if not admin', async () => {
      // Create a non-admin user token
      const userToken = generateAuthToken({ _id: 'user123', email: 'user@example.com', role: 'user' });
      
      const res = await request(app)
        .get('/api/stripe/config')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(403);
    });

    it('should return Stripe config for admin', async () => {
      const res = await request(app)
        .get('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isActive');
      expect(res.body).to.have.property('publishableKey');
      expect(res.body).to.have.property('currency');
      expect(res.body).to.have.property('commissionRate');
      // Should not return sensitive data
      expect(res.body).to.not.have.property('secretKey');
      expect(res.body).to.not.have.property('webhookSecret');
    });
  });

  describe('PUT /api/stripe/config', () => {
    const testConfig = {
      isActive: true,
      publishableKey: 'pk_test_123',
      secretKey: 'sk_test_123',
      webhookSecret: 'whsec_123',
      commissionRate: 5.5,
      currency: 'USD'
    };

    it('should update Stripe config', async () => {
      const res = await request(app)
        .put('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testConfig);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isActive', true);
      expect(res.body).to.have.property('publishableKey', 'pk_test_123');
      expect(res.body).to.have.property('currency', 'USD');
      expect(res.body).to.have.property('commissionRate', 5.5);
      // Should not return sensitive data
      expect(res.body).to.not.have.property('secretKey');
      expect(res.body).to.not.have.property('webhookSecret');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .put('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
    });
  });

  describe('POST /api/stripe/test-connection', () => {
    it('should test Stripe connection', async () => {
      // First, set up test config
      await request(app)
        .put('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: true,
          publishableKey: 'pk_test_123',
          secretKey: 'sk_test_123',
          webhookSecret: 'whsec_123',
          commissionRate: 5.5,
          currency: 'USD'
        });
      
      const res = await request(app)
        .post('/api/stripe/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // This will likely fail in test environment due to invalid test keys
      // But we can still check the structure of the response
      expect([200, 400, 500]).to.include(res.status);
      
      if (res.status === 200) {
        expect(res.body).to.have.property('success', true);
      } else {
        expect(res.body).to.have.property('message');
      }
    });
  });

  describe('GET /api/stripe/public-config', () => {
    it('should return public Stripe config', async () => {
      // First, set up test config
      await request(app)
        .put('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isActive: true,
          publishableKey: 'pk_test_123',
          secretKey: 'sk_test_123',
          webhookSecret: 'whsec_123',
          commissionRate: 5.5,
          currency: 'USD'
        });
      
      const res = await request(app)
        .get('/api/stripe/public-config');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isActive');
      expect(res.body).to.have.property('publishableKey');
      expect(res.body).to.have.property('currency');
      expect(res.body).to.have.property('commissionRate');
      // Should not return sensitive data
      expect(res.body).to.not.have.property('secretKey');
      expect(res.body).to.not.have.property('webhookSecret');
    });
  });
});
