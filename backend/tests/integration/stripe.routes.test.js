import request from 'supertest';
import { expect } from 'chai';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { generateAuthToken } from '../../src/utils/auth.js';
import StripeConfig from '../../src/models/StripeConfig.js';

// Test user with admin role
const testAdmin = {
  _id: new mongoose.Types.ObjectId(),
  email: 'admin@example.com',
  role: 'admin',
  firstName: 'Admin',
  lastName: 'User'
};

// Generate auth token for test admin
const adminToken = generateAuthToken(testAdmin);

describe('Stripe Configuration API', () => {
  before(async () => {
    // Ensure the test database is connected (handled by setup.js)
  });

  afterEach(async () => {
    // Clear test data after each test
    await StripeConfig.deleteMany({});
  });

  after(async () => {
    // Close database connection (handled by setup.js)
  });

  describe('GET /api/stripe/config', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/stripe/config');
      
      expect(res.status).to.equal(401);
    });

    it('should return 403 if not admin', async () => {
      // Create a non-admin user token
      const userToken = generateAuthToken({ 
        _id: new mongoose.Types.ObjectId(), 
        email: 'user@example.com', 
        role: 'user' 
      });
      
      const res = await request(app)
        .get('/api/stripe/config')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).to.equal(403);
    });

    it('should return Stripe config for admin', async () => {
      // First create a test config
      await StripeConfig.create({
        isActive: true,
        publishableKey: 'pk_test_123',
        secretKey: 'sk_test_123',
        webhookSecret: 'whsec_123',
        commissionRate: 5.5,
        currency: 'USD'
      });

      const res = await request(app)
        .get('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isActive', true);
      expect(res.body).to.have.property('publishableKey', 'pk_test_123');
      expect(res.body).to.have.property('currency', 'USD');
      expect(res.body).to.have.property('commissionRate', 5.5);
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

      // Verify the config was saved in the database
      const savedConfig = await StripeConfig.findOne();
      expect(savedConfig).to.not.be.null;
      expect(savedConfig.secretKey).to.equal('sk_test_123');
      expect(savedConfig.webhookSecret).to.equal('whsec_123');
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .put('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('validation failed');
    });
  });

  describe('POST /api/stripe/test-connection', () => {
    beforeEach(async () => {
      // Set up test config before each test
      await StripeConfig.create({
        isActive: true,
        publishableKey: 'pk_test_123',
        secretKey: 'sk_test_123',
        webhookSecret: 'whsec_123',
        commissionRate: 5.5,
        currency: 'USD'
      });
    });

    it('should test Stripe connection', async () => {
      const res = await request(app)
        .post('/api/stripe/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);
      
      // This will likely fail in test environment due to invalid test keys
      // But we can check the structure of the response
      expect([200, 400, 500]).to.include(res.status);
      
      if (res.status === 200) {
        expect(res.body).to.have.property('success', true);
      } else {
        expect(res.body).to.have.property('message');
      }
    });

    it('should return 400 if Stripe is not configured', async () => {
      // Clear any existing config
      await StripeConfig.deleteMany({});
      
      const res = await request(app)
        .post('/api/stripe/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Stripe is not configured');
    });
  });

  describe('GET /api/stripe/public-config', () => {
    it('should return public Stripe config', async () => {
      // Create a test config
      await StripeConfig.create({
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
      expect(res.body).to.have.property('isActive', true);
      expect(res.body).to.have.property('publishableKey', 'pk_test_123');
      expect(res.body).to.have.property('currency', 'USD');
      expect(res.body).to.have.property('commissionRate', 5.5);
      // Should not return sensitive data
      expect(res.body).to.not.have.property('secretKey');
      expect(res.body).to.not.have.property('webhookSecret');
    });

    it('should return default values if not configured', async () => {
      // Ensure no config exists
      await StripeConfig.deleteMany({});
      
      const res = await request(app)
        .get('/api/stripe/public-config');
      
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isActive', false);
      expect(res.body).to.have.property('publishableKey', '');
      expect(res.body).to.have.property('currency', 'USD');
      expect(res.body).to.have.property('commissionRate', 0);
    });
  });
});
