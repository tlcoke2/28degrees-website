import Stripe from 'stripe';
import request from 'supertest';
import { expect } from 'chai';
import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the auth controller for token generation
import { signToken } from './src/controllers/auth.controller.js';

// Create a test Express app
const app = express();
app.use(express.json());

// Import and use your routes
import routes from './src/routes/index.js';
app.use('/api', routes);

// Initialize Stripe with test key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Define models for testing
const User = (sequelize) => {
  return sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });
};

// Database connection function
const setupTestDatabase = async () => {
  // Set up SQLite in-memory database for testing
  const sequelize = new Sequelize('sqlite::memory:', {
    logging: false // Disable logging for cleaner test output
  });

  try {
    // Initialize models
    const UserModel = User(sequelize);
    
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Test database synchronized');
    
    return { sequelize, User: UserModel };
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
};

// Test data
const testAdmin = {
  id: 1,
  email: 'admin@example.com',
  role: 'admin',
  name: 'Test Admin',
  password: 'password123'
};

const testUser = {
  id: 2,
  email: 'customer@example.com',
  role: 'user',
  name: 'Test User',
  password: 'password123'
};

// These will be set after the test database is initialized
let adminToken;
let userToken;
let testDb;

// Test credit card details
const testCard = {
  number: '4242424242424242', // Test card that succeeds
  exp_month: 12,
  exp_year: new Date().getFullYear() + 1,
  cvc: '123'
};

const testCardDeclined = {
  number: '4000000000000002', // Test card that will be declined
  exp_month: 12,
  exp_year: new Date().getFullYear() + 1,
  cvc: '123'
};

describe('Stripe End-to-End Tests', function() {
  // Increase timeout for all tests
  this.timeout(30000);
  
  let paymentIntentId;
  let customerId;
  let paymentMethodId;
  
  before(async () => {
    // Set up test database
    testDb = await setupTestDatabase();
    
    // Create test users
    const adminUser = await testDb.User.create(testAdmin);
    const regularUser = await testDb.User.create(testUser);
    
    // Generate tokens for test users
    adminToken = signToken(adminUser.id);
    userToken = signToken(regularUser.id);
    
    console.log('Test database and users initialized');
  });
  
  after(async () => {
    // Close the database connection after all tests
    if (testDb && testDb.sequelize) {
      await testDb.sequelize.close();
      console.log('Test database connection closed');
    }
  });

    
    // Create a test customer in Stripe
    const customer = await stripe.customers.create({
      email: testUser.email,
      metadata: { userId: testUser.id.toString() } // Convert to string for consistency
    });
    customerId = customer.id;
    
    // Create a payment method
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: testCard
    });
    paymentMethodId = paymentMethod.id;
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    
    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  });
  
  afterEach(async () => {
    // Clean up any test data after each test if needed
  });
  
  after(async () => {
    // Clean up test data
    if (customerId) {
      try { 
        await stripe.customers.del(customerId); 
      } catch (e) {
        console.error('Error cleaning up test customer:', e);
      }
    }
  });

  describe('Stripe Configuration', () => {
    it('should update Stripe configuration', async () => {
      const config = {
        isActive: true,
        isTestMode: true,
        publishableKey: 'pk_test_' + 'x'.repeat(24),
        secretKey: 'sk_test_' + 'x'.repeat(24),
        webhookSecret: 'whsec_' + 'x'.repeat(24),
        commissionRate: 2.9,
        currency: 'usd'
      };

      const res = await request(app)
        .put('/api/stripe/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(config);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('isActive', true);
      expect(res.body).to.have.property('isTestMode', true);
    });
  });

  describe('Payment Flow', () => {
    it('should create a payment intent', async () => {
      const paymentData = {
        amount: 1000, // $10.00
        currency: 'usd',
        customerId,
        description: 'Test Payment',
        metadata: {
          bookingId: 'test-booking-123'
        }
      };

      const res = await request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('clientSecret');
      expect(res.body).to.have.property('publishableKey');
      
      paymentIntentId = res.body.paymentIntentId;
    });

    it('should confirm a payment intent', async () => {
      const confirmData = {
        paymentIntentId,
        paymentMethodId,
        returnUrl: 'http://localhost:3000/payment/complete'
      };

      const res = await request(app)
        .post('/api/payments/confirm-payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(confirmData);

      expect([200, 202]).to.include(res.status);
      expect(res.body).to.have.property('status');
      expect(['succeeded', 'processing']).to.include(res.body.status);
    });

    it('should handle failed payments', async () => {
      // Create a new payment intent with a failing card
      const paymentData = {
        amount: 1000,
        currency: 'usd',
        customerId,
        paymentMethodId: await (async () => {
          const pm = await stripe.paymentMethods.create({
            type: 'card',
            card: testCardDeclined
          });
          return pm.id;
        })(),
        description: 'Test Failed Payment'
      };

      const res = await request(app)
        .post('/api/payments/confirm-payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData);

      expect(res.status).to.equal(402);
      expect(res.body).to.have.property('error');
    });
  });

  describe('Webhook Handling', () => {
    it('should process payment_intent.succeeded event', async () => {
      const event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentIntentId,
            amount: 1000,
            currency: 'usd',
            customer: customerId,
            metadata: {
              bookingId: 'test-booking-123'
            }
          }
        }
      };

      const res = await request(app)
        .post('/api/stripe/webhook')
        .send(event)
        .set('Stripe-Signature', 'test_signature');

      expect(res.status).to.equal(200);
    });
  });

  describe('Refund Flow', () => {
    it('should process a refund', async () => {
      const refundData = {
        paymentIntentId,
        amount: 500, // Refund $5.00
        reason: 'requested_by_customer'
      };

      const res = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('status', 'succeeded');
    });
  });
});

// Helper function to verify webhook signature
const verifyWebhookSignature = (payload, secret, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return event;
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
};
