import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Booking from '../src/models/Booking.model.js';
import Tour from '../src/models/Tour.model.js';
import User from '../src/models/User.model.js';
import { 
  createTestUser, 
  createTestAdmin, 
  createTestTour,
  cleanupTestData,
  getAuthHeader
} from './testUtils.js';

describe('Booking API', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;
  let testTour;
  let testBooking;

  beforeAll(async () => {
    // Create test users
    const regular = await createTestUser({
      email: 'booker@example.com',
      name: 'Tour Booker'
    });
    
    const admin = await createTestAdmin();
    
    regularUser = regular.user;
    regularToken = regular.token;
    adminUser = admin.user;
    adminToken = admin.token;
    
    // Create a test tour
    testTour = await createTestTour({
      name: 'Tour for Booking',
      price: 299,
      startDates: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)], // 7 days from now
      maxGroupSize: 10,
      startLocation: {
        type: 'Point',
        coordinates: [0, 0],
        address: 'Booking Location',
        description: 'Booking meeting point',
      },
    });
    
    // Create a test booking
    testBooking = await Booking.create({
      tour: testTour._id,
      user: regularUser._id,
      price: testTour.price,
      status: 'paid'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    // Close the database connection
    await mongoose.connection.close();
  });

  describe('POST /api/v1/bookings/checkout-session/:tourId', () => {
    it('should create a checkout session', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/checkout-session/${testTour._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.session).toBeDefined();
      expect(res.body.session.url).toBeDefined();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/v1/bookings/checkout-session/${testTour._id}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should return 404 if tour does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/bookings/checkout-session/${nonExistentId}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No tour found with that ID');
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should get all bookings (admin only)', async () => {
      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.bookings)).toBe(true);
      expect(res.body.data.bookings.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/bookings/my-bookings', () => {
    it('should get the current user\'s bookings', async () => {
      const res = await request(app)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.bookings)).toBe(true);
      expect(res.body.data.bookings.length).toBe(1);
      expect(res.body.data.bookings[0]._id).toBe(testBooking._id.toString());
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/v1/bookings/my-bookings');
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should get a booking by ID (admin only)', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.booking._id).toBe(testBooking._id.toString());
      expect(res.body.data.booking.tour._id).toBe(testTour._id.toString());
      expect(res.body.data.booking.user._id).toBe(regularUser._id.toString());
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get(`/api/v1/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a new booking (admin only)', async () => {
      const newBooking = {
        tour: testTour._id,
        user: regularUser._id,
        price: 299,
        status: 'confirmed'
      };

      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newBooking);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.booking.tour._id).toBe(testTour._id.toString());
      expect(res.body.data.booking.user._id).toBe(regularUser._id.toString());
      expect(res.body.data.booking.price).toBe(newBooking.price);
      expect(res.body.data.booking.status).toBe(newBooking.status);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('validation failed');
    });
  });

  describe('PATCH /api/v1/bookings/:id', () => {
    it('should update a booking (admin only)', async () => {
      const updates = {
        status: 'cancelled',
        price: 249,
        paid: false
      };

      const res = await request(app)
        .patch(`/api/v1/bookings/${testBooking._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.booking.status).toBe(updates.status);
      expect(res.body.data.booking.price).toBe(updates.price);
      expect(res.body.data.booking.paid).toBe(updates.paid);
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/v1/bookings/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No booking found with that ID');
    });
  });

  describe('DELETE /api/v1/bookings/:id', () => {
    it('should delete a booking (admin only)', async () => {
      // Create a booking to delete
      const bookingToDelete = await Booking.create({
        tour: testTour._id,
        user: regularUser._id,
        price: 299,
        status: 'paid'
      });

      const res = await request(app)
        .delete(`/api/v1/bookings/${bookingToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(204);
      
      // Verify the booking was deleted
      const deletedBooking = await Booking.findById(bookingToDelete._id);
      expect(deletedBooking).toBeNull();
    });

    it('should return 404 for non-existent booking', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/bookings/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No booking found with that ID');
    });
  });

  describe('GET /api/v1/bookings/checkout/:sessionId', () => {
    it('should get a booking by session ID', async () => {
      // This test would require a real Stripe session ID
      // For now, we'll test the error case
      const res = await request(app)
        .get('/api/v1/bookings/checkout/invalid-session-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
    });
  });
});
