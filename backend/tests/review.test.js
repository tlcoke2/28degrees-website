import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import Review from '../src/models/Review.model.js';
import Tour from '../src/models/Tour.model.js';
import User from '../src/models/User.model.js';
import { 
  createTestUser, 
  createTestAdmin, 
  createTestTour,
  createTestReview,
  cleanupTestData
} from './testUtils.js';

describe('Review API', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;
  let testTour;
  let testReview;

  beforeAll(async () => {
    // Create test users
    const regular = await createTestUser({
      email: 'reviewer@example.com',
      name: 'Review Writer'
    });
    
    const admin = await createTestAdmin();
    
    regularUser = regular.user;
    regularToken = regular.token;
    adminUser = admin.user;
    adminToken = admin.token;
    
    // Create a test tour
    testTour = await createTestTour({
      name: 'Tour for Reviews',
      price: 199,
      ratingsAverage: 4.5,
      ratingsQuantity: 2
    });
    
    // Create a test review
    testReview = await createTestReview(
      testTour._id,
      regularUser._id,
      {
        review: 'Great tour!',
        rating: 5
      }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    // Close the database connection
    await mongoose.connection.close();
  });

  describe('GET /api/v1/reviews', () => {
    it('should get all reviews', async () => {
      // Create an additional review for testing
      await createTestReview(
        testTour._id,
        adminUser._id,
        {
          review: 'Amazing experience!',
          rating: 5
        }
      );
      
      const res = await request(app).get('/api/v1/reviews');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(2);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
      expect(res.body.data.reviews.length).toBe(2);
    });
    
    it('should filter reviews by tour', async () => {
      // Create a second tour and review
      const secondTour = await createTestTour({
        name: 'Second Tour',
        price: 299
      });
      
      await createTestReview(
        secondTour._id,
        adminUser._id,
        {
          review: 'Another great tour!',
          rating: 4
        }
      );
      
      const res = await request(app)
        .get(`/api/v1/reviews?tour=${testTour._id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.reviews[0].tour._id).toBe(testTour._id.toString());
    });
  });

  describe('GET /api/v1/reviews/:id', () => {
    it('should get a single review by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/reviews/${testReview._id}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review._id).toBe(testReview._id.toString());
      expect(res.body.data.review.review).toBe('Great tour!');
      expect(res.body.data.review.rating).toBe(5);
      expect(res.body.data.review.tour._id).toBe(testTour._id.toString());
      expect(res.body.data.review.user._id).toBe(regularUser._id.toString());
    });

    it('should return 404 for non-existent review', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/v1/reviews/${nonExistentId}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No review found with that ID');
    });
  });

  describe('POST /api/v1/reviews', () => {
    it('should create a new review for a booked tour', async () => {
      // Create a booking for the user to allow review
      await request(app)
        .post(`/api/v1/bookings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tour: testTour._id,
          user: regularUser._id,
          price: testTour.price,
          status: 'confirmed'
        });
      
      const newReview = {
        review: 'Amazing experience!',
        rating: 5,
        tour: testTour._id
      };
      
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(newReview);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.review).toBe(newReview.review);
      expect(res.body.data.review.rating).toBe(newReview.rating);
      expect(res.body.data.review.tour._id).toBe(testTour._id.toString());
      expect(res.body.data.review.user._id).toBe(regularUser._id.toString());
      
      // Verify the tour's ratings were updated
      const updatedTour = await Tour.findById(testTour._id);
      expect(updatedTour.ratingsAverage).toBeDefined();
      expect(updatedTour.ratingsQuantity).toBe(2); // 1 from before, 1 new
    });
    
    it('should return 400 if user has not booked the tour', async () => {
      // Create a new tour that the user hasn't booked
      const newTour = await createTestTour({
        name: 'Unbooked Tour',
        price: 399
      });
      
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          review: 'I should not be able to review this',
          rating: 5,
          tour: newTour._id
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('You can only review tours you have booked');
    });
    
    it('should return 400 if user has already reviewed the tour', async () => {
      // User already has a review for testTour from beforeAll
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          review: 'Duplicate review',
          rating: 4,
          tour: testTour._id
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('You have already reviewed this tour');
    });
  });

  describe('PATCH /api/v1/reviews/:id', () => {
    it('should update a review (review owner only)', async () => {
      const updates = {
        review: 'Updated review text',
        rating: 4
      };
      
      const res = await request(app)
        .patch(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updates);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.review).toBe(updates.review);
      expect(res.body.data.review.rating).toBe(updates.rating);
      
      // Verify the review was updated in the database
      const updatedReview = await Review.findById(testReview._id);
      expect(updatedReview.review).toBe(updates.review);
      expect(updatedReview.rating).toBe(updates.rating);
    });
    
    it('should return 403 if not the review owner', async () => {
      // Create another user who is not the review owner
      const { token: otherUserToken } = await createTestUser({
        email: 'other@example.com',
        name: 'Other User'
      });
      
      const res = await request(app)
        .patch(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          review: 'Unauthorized update',
          rating: 1
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Not authorized to update this review');
    });
    
    it('should allow admin to update any review', async () => {
      const updates = {
        review: 'Admin updated this review',
        rating: 3
      };
      
      const res = await request(app)
        .patch(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.review.review).toBe(updates.review);
      expect(res.body.data.review.rating).toBe(updates.rating);
    });
  });

  describe('DELETE /api/v1/reviews/:id', () => {
    it('should delete a review (review owner or admin)', async () => {
      // Create a review to delete
      const reviewToDelete = await createTestReview(
        testTour._id,
        regularUser._id,
        {
          review: 'This will be deleted',
          rating: 4
        }
      );
      
      const res = await request(app)
        .delete(`/api/v1/reviews/${reviewToDelete._id}`)
        .set('Authorization', `Bearer ${regularToken}`);
      
      expect(res.statusCode).toBe(204);
      
      // Verify the review was deleted
      const deletedReview = await Review.findById(reviewToDelete._id);
      expect(deletedReview).toBeNull();
      
      // Verify the tour's ratings were updated
      const updatedTour = await Tour.findById(testTour._id);
      expect(updatedTour.ratingsQuantity).toBe(1); // One less review now
    });
    
    it('should return 403 if not the review owner', async () => {
      // Create another user who is not the review owner
      const { token: otherUserToken } = await createTestUser({
        email: 'another@example.com',
        name: 'Another User'
      });
      
      const res = await request(app)
        .delete(`/api/v1/reviews/${testReview._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Not authorized to delete this review');
    });
    
    it('should allow admin to delete any review', async () => {
      // Create a review to delete
      const reviewToDelete = await createTestReview(
        testTour._id,
        regularUser._id,
        {
          review: 'Admin will delete this',
          rating: 4
        }
      );
      
      const res = await request(app)
        .delete(`/api/v1/reviews/${reviewToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(204);
      
      // Verify the review was deleted
      const deletedReview = await Review.findById(reviewToDelete._id);
      expect(deletedReview).toBeNull();
    });
  });

  describe('GET /api/v1/tours/:tourId/reviews', () => {
    it('should get all reviews for a specific tour', async () => {
      const res = await request(app)
        .get(`/api/v1/tours/${testTour._id}/reviews`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
      expect(res.body.data.reviews.length).toBeGreaterThan(0);
      
      // All reviews should be for the specified tour
      res.body.data.reviews.forEach((review: any) => {
        expect(review.tour._id).toBe(testTour._id.toString());
      });
    });
    
    it('should return 404 for non-existent tour ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/v1/tours/${nonExistentId}/reviews`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('No tour found with that ID');
    });
  });
});
