import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Tour from '../src/models/Tour.model.js';
import User from '../src/models/User.model.js';
import Review from '../src/models/Review.model.js';
import { 
  createTestUser, 
  createTestAdmin, 
  createTestTour,
  cleanupTestData,
  createTestReview
} from './testUtils.js';

describe('Tour API', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;
  let testTour;

  beforeAll(async () => {
    // Create test users and tour
    const regular = await createTestUser();
    const admin = await createTestAdmin();
    
    regularUser = regular.user;
    regularToken = regular.token;
    adminUser = admin.user;
    adminToken = admin.token;
    
    // Create a test tour
    testTour = await createTestTour({
      name: 'Test Tour',
      price: 299,
      duration: 5,
      maxGroupSize: 15,
      difficulty: 'easy',
      ratingsAverage: 4.5,
      ratingsQuantity: 10,
      priceDiscount: 0,
      summary: 'A test tour for API testing',
      description: 'Detailed description of the test tour',
      imageCover: 'test-tour-cover.jpg',
      images: ['test-tour-1.jpg', 'test-tour-2.jpg'],
      startDates: [
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      ],
      startLocation: {
        type: 'Point',
        coordinates: [0, 0],
        address: 'Test Location',
        description: 'Test meeting point',
      },
      locations: [
        {
          type: 'Point',
          coordinates: [0, 0],
          address: 'Test Location 1',
          description: 'Test location 1',
          day: 1,
        },
        {
          type: 'Point',
          coordinates: [0.1, 0.1],
          address: 'Test Location 2',
          description: 'Test location 2',
          day: 2,
        },
      ]
    }, adminUser._id);
    
    // Add some reviews
    await createTestReview(testTour._id, regularUser._id, {
      review: 'Great tour!',
      rating: 5
    });
    
    await createTestReview(testTour._id, adminUser._id, {
      review: 'Amazing experience',
      rating: 4.5
    });
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    // Close the database connection
    await mongoose.connection.close();
  });

  describe('GET /api/v1/tours', () => {
    it('should get all tours with filtering, sorting, and pagination', async () => {
      // Create additional tours for testing
      await createTestTour({ name: 'Mountain Adventure', price: 399, difficulty: 'medium' });
      await createTestTour({ name: 'Beach Vacation', price: 499, difficulty: 'easy' });
      
      // Test basic query
      let res = await request(app).get('/api/v1/tours');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(3);
      expect(res.body.data.tours.length).toBe(3);
      
      // Test filtering
      res = await request(app).get('/api/v1/tours?difficulty=easy&price[lt]=500');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tours.every((tour: any) => 
        tour.difficulty === 'easy' && tour.price < 500
      )).toBeTruthy();
      
      // Test sorting
      res = await request(app).get('/api/v1/tours?sort=-price');
      expect(res.statusCode).toBe(200);
      const prices = res.body.data.tours.map((tour: any) => tour.price);
      const sortedPrices = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sortedPrices);
      
      // Test field limiting
      res = await request(app).get('/api/v1/tours?fields=name,price');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tours[0]).toHaveProperty('name');
      expect(res.body.data.tours[0]).toHaveProperty('price');
      expect(res.body.data.tours[0]).not.toHaveProperty('description');
      
      // Test pagination
      res = await request(app).get('/api/v1/tours?limit=2&page=1');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.tours.length).toBe(2);
    });
  });

  describe('GET /api/v1/tours/:id', () => {
    it('should get a single tour by ID', async () => {
      const res = await request(app).get(`/api/v1/tours/${testTour._id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tour._id).toBe(testTour._id.toString());
      expect(res.body.data.tour.name).toBe(testTour.name);
      expect(res.body.data.tour.reviews).toBeDefined();
      expect(res.body.data.tour.reviews.length).toBe(2);
    });

    it('should return 404 for non-existent tour ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/v1/tours/${nonExistentId}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No tour found with that ID');
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/api/v1/tours/invalid-id');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Invalid ID');
    });
  });

  describe('GET /api/v1/tours/top-5-cheap', () => {
    it('should get the top 5 cheapest tours', async () => {
      // Create tours with different prices
      await createTestTour({ name: 'Cheap Tour 1', price: 99 });
      await createTestTour({ name: 'Cheap Tour 2', price: 199 });
      await createTestTour({ name: 'Cheap Tour 3', price: 149 });
      
      const res = await request(app).get('/api/v1/tours/top-5-cheap');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tours.length).toBe(5);
      
      // Verify sorting by price (ascending)
      const prices = res.body.data.tours.map((tour: any) => tour.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });
  });

  describe('GET /api/v1/tours/tour-stats', () => {
    it('should get tour statistics', async () => {
      const res = await request(app).get('/api/v1/tours/tour-stats');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats).toHaveProperty('numTours');
      expect(res.body.data.stats).toHaveProperty('numRatings');
      expect(res.body.data.stats).toHaveProperty('avgRating');
      expect(res.body.data.stats).toHaveProperty('avgPrice');
      expect(res.body.data.stats).toHaveProperty('minPrice');
      expect(res.body.data.stats).toHaveProperty('maxPrice');
    });
  });

  describe('GET /api/v1/tours/monthly-plan/:year', () => {
    it('should get monthly plan for tours', async () => {
      const year = new Date().getFullYear();
      const res = await request(app).get(`/api/v1/tours/monthly-plan/${year}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.plan)).toBe(true);
    });
  });

  // Protected routes (require authentication and authorization)
  describe('POST /api/v1/tours (Admin)', () => {
    it('should create a new tour (admin only)', async () => {
      const newTour = {
        name: 'New Test Tour',
        price: 399,
        duration: 7,
        maxGroupSize: 10,
        difficulty: 'medium',
        ratingsAverage: 4.7,
        ratingsQuantity: 0,
        priceDiscount: 50,
        summary: 'A new test tour',
        description: 'Detailed description of the new test tour',
        imageCover: 'new-tour-cover.jpg',
        images: ['new-tour-1.jpg', 'new-tour-2.jpg'],
        startLocation: {
          type: 'Point',
          coordinates: [0, 0],
          address: 'New Test Location',
          description: 'New test meeting point',
        },
        locations: [
          {
            type: 'Point',
            coordinates: [0, 0],
            address: 'New Test Location 1',
            description: 'New test location 1',
            day: 1,
          },
        ],
        startDates: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)], // 30 days from now
      };

      const res = await request(app)
        .post('/api/v1/tours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newTour);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tour.name).toBe(newTour.name);
      expect(res.body.data.tour.price).toBe(newTour.price);
      
      // Verify the tour was saved to the database
      const savedTour = await Tour.findOne({ name: newTour.name });
      expect(savedTour).toBeDefined();
      expect(savedTour.price).toBe(newTour.price);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .post('/api/v1/tours')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Unauthorized Tour',
          price: 299,
          duration: 3,
          maxGroupSize: 10,
          difficulty: 'easy',
          summary: 'This should fail',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PATCH /api/v1/tours/:id (Admin)', () => {
    it('should update a tour (admin only)', async () => {
      const updates = {
        name: 'Updated Test Tour',
        price: 449,
        difficulty: 'challenging'
      };

      const res = await request(app)
        .patch(`/api/v1/tours/${testTour._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.tour.name).toBe(updates.name);
      expect(res.body.data.tour.price).toBe(updates.price);
      expect(res.body.data.tour.difficulty).toBe(updates.difficulty);
      
      // Verify the tour was updated in the database
      const updatedTour = await Tour.findById(testTour._id);
      expect(updatedTour.name).toBe(updates.name);
      expect(updatedTour.price).toBe(updates.price);
      expect(updatedTour.difficulty).toBe(updates.difficulty);
    });
  });

  describe('DELETE /api/v1/tours/:id (Admin)', () => {
    it('should delete a tour (admin only)', async () => {
      // Create a tour to delete
      const tourToDelete = await createTestTour({
        name: 'Tour to Delete',
        price: 199
      });

      const res = await request(app)
        .delete(`/api/v1/tours/${tourToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(204);
      
      // Verify the tour was deleted from the database
      const deletedTour = await Tour.findById(tourToDelete._id);
      expect(deletedTour).toBeNull();
    });
  });

  // Geospatial queries
  describe('GET /api/v1/tours/tours-within', () => {
    it('should get tours within a certain distance from a point', async () => {
      // Create a tour with a specific location
      await createTestTour({
        name: 'Nearby Tour',
        startLocation: {
          type: 'Point',
          coordinates: [0.1, 0.1], // Close to our test point
          address: 'Nearby Location',
          description: 'Nearby meeting point',
        }
      });

      const distance = 100; // 100 kilometers
      const lat = 0;
      const lng = 0;
      const unit = 'km';

      const res = await request(app)
        .get(`/api/v1/tours/tours-within?distance=${distance}&latlng=${lat},${lng}&unit=${unit}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.tours)).toBe(true);
      expect(res.body.data.tours.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/tours/distances', () => {
    it('should get distances from a point to all tours', async () => {
      const lat = 0;
      const lng = 0;
      const unit = 'km';

      const res = await request(app)
        .get(`/api/v1/tours/distances?latlng=${lat},${lng}&unit=${unit}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.distances)).toBe(true);
      expect(res.body.data.distances.length).toBeGreaterThan(0);
    });
  });
});
