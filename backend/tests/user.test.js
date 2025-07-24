import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import app from '../server.js';
import User from '../src/models/User.model.js';
import { 
  createTestUser, 
  createTestAdmin, 
  cleanupTestData, 
  getAuthHeader,
  createTestTour
} from './testUtils.js';

describe('User API', () => {
  let regularUser;
  let adminUser;
  let regularToken;
  let adminToken;

  beforeAll(async () => {
    // Create test users
    const regular = await createTestUser({
      email: 'regular@example.com',
      name: 'Regular User'
    });
    
    const admin = await createTestAdmin();
    
    regularUser = regular.user;
    regularToken = regular.token;
    adminUser = admin.user;
    adminToken = admin.token;
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    // Close the database connection
    await mongoose.connection.close();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return the current user data', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user._id).toBe(regularUser._id.toString());
      expect(res.body.data.user.email).toBe(regularUser.email);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PATCH /api/v1/users/updateMe', () => {
    it('should update the current user data', async () => {
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const res = await request(app)
        .patch('/api/v1/users/updateMe')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe(updates.name);
      expect(res.body.data.user.email).toBe(updates.email);

      // Verify the user was updated in the database
      const updatedUser = await User.findById(regularUser._id);
      expect(updatedUser.name).toBe(updates.name);
      expect(updatedUser.email).toBe(updates.email);
    });

    it('should not allow updating password through this route', async () => {
      const res = await request(app)
        .patch('/api/v1/users/updateMe')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('This route is not for password updates');
    });
  });

  describe('DELETE /api/v1/users/deleteMe', () => {
    it('should deactivate the current user account', async () => {
      const res = await request(app)
        .delete('/api/v1/users/deleteMe')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.statusCode).toBe(204);

      // Verify the user was deactivated
      const user = await User.findById(regularUser._id);
      expect(user.active).toBe(false);
    });
  });

  describe('POST /api/v1/users/forgotPassword', () => {
    it('should send a password reset email', async () => {
      const res = await request(app)
        .post('/api/v1/users/forgotPassword')
        .send({ email: regularUser.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Token sent to email');

      // Verify the reset token was saved
      const user = await User.findOne({ email: regularUser.email });
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
    });
  });

  describe('PATCH /api/v1/users/updateMyPassword', () => {
    it('should update the current user password', async () => {
      const res = await request(app)
        .patch('/api/v1/users/updateMyPassword')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          currentPassword: 'test1234',
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();

      // Verify the password was updated
      const user = await User.findById(regularUser._id).select('+password');
      expect(await user.correctPassword('newpassword123', user.password)).toBe(true);
    });
  });

  // Admin routes
  describe('GET /api/v1/users (Admin)', () => {
    it('should get all users (admin only)', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBeDefined();
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/users/:id (Admin)', () => {
    it('should get a user by ID (admin only)', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user._id).toBe(regularUser._id.toString());
    });
  });

  describe('PATCH /api/v1/users/:id (Admin)', () => {
    it('should update a user (admin only)', async () => {
      const updates = {
        name: 'Admin Updated Name',
        role: 'guide'
      };

      const res = await request(app)
        .patch(`/api/v1/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe(updates.name);
      expect(res.body.data.user.role).toBe(updates.role);
    });
  });

  describe('DELETE /api/v1/users/:id (Admin)', () => {
    it('should delete a user (admin only)', async () => {
      // Create a test user to delete
      const { user } = await createTestUser({
        email: 'todelete@example.com',
        name: 'To Delete'
      });

      const res = await request(app)
        .delete(`/api/v1/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(204);

      // Verify the user was deleted
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
});
