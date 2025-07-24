import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../src/models/User.model.js';
import { 
  createTestUser, 
  cleanupTestData, 
  getAuthHeader 
} from './testUtils.js';

describe('Auth API', () => {
  let testUser;
  let testToken;
  let verificationToken;

  beforeAll(async () => {
    // Create a test user
    const { user, token } = await createTestUser({
      email: 'auth@example.com',
      name: 'Auth Test User'
    });
    
    testUser = user;
    testToken = token;
    
    // Generate a verification token for testing
    verificationToken = testUser.createEmailVerificationToken();
    await testUser.save({ validateBeforeSave: false });
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    // Close the database connection
    await mongoose.connection.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newuser@example.com',
        password: 'test1234',
        passwordConfirm: 'test1234',
        role: 'user'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe(newUser.email.toLowerCase());
      expect(res.body.data.user.name).toBe(newUser.name);
      expect(res.body.data.user.role).toBe('user'); // Default role
      expect(res.body.data.user.active).toBe(false); // Should be inactive until email is verified
      expect(res.body.data.user.password).toBeUndefined();
      
      // Verify the user was saved to the database
      const savedUser = await User.findOne({ email: newUser.email.toLowerCase() });
      expect(savedUser).toBeDefined();
      expect(savedUser.name).toBe(newUser.name);
      expect(savedUser.password).not.toBe(newUser.password);
      expect(savedUser.emailVerificationToken).toBeDefined();
      expect(savedUser.emailVerificationExpires).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Incomplete User',
          // Missing email and password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Please provide your email');
      expect(res.body.message).toContain('Please provide a password');
    });

    it('should return 400 if passwords do not match', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Mismatch User',
          email: 'mismatch@example.com',
          password: 'password123',
          passwordConfirm: 'differentpassword',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Passwords do not match');
    });
    
    it('should return 400 if email is already in use', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate Email',
          email: testUser.email, // Already exists
          password: 'test1234',
          passwordConfirm: 'test1234',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Email already in use');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login an existing user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'test1234', // Default password from createTestUser
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();
      
      // Check if the JWT cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('jwt='))).toBeTruthy();
    });

    it('should return 401 with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Incorrect email or password');
    });

    it('should return 401 with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'test1234',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Incorrect email or password');
    });
    
    it('should return 401 if account is not active', async () => {
      // Create an inactive user
      const inactiveUser = await User.create({
        name: 'Inactive User',
        email: 'inactive@example.com',
        password: 'test1234',
        passwordConfirm: 'test1234',
        active: false
      });
      
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: inactiveUser.email,
          password: 'test1234',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Your account is not active. Please verify your email.');
    });
  });

  describe('GET /api/v1/auth/verify-email/:token', () => {
    it('should verify an email with a valid token', async () => {
      const res = await request(app)
        .get(`/api/v1/auth/verify-email/${verificationToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Email verified successfully');
      
      // Verify the user is now active
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.active).toBe(true);
      expect(updatedUser.emailVerificationToken).toBeUndefined();
      expect(updatedUser.emailVerificationExpires).toBeUndefined();
    });
    
    it('should return 400 with an invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/verify-email/invalid-token');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Invalid or expired verification token');
    });
    
    it('should return 400 with an expired token', async () => {
      // Create a user with an expired token
      const user = await User.create({
        name: 'Expired Token User',
        email: 'expired@example.com',
        password: 'test1234',
        passwordConfirm: 'test1234',
        emailVerificationToken: 'expired-token',
        emailVerificationExpires: Date.now() - 24 * 60 * 60 * 1000 // 1 day ago
      });
      
      const res = await request(app)
        .get(`/api/v1/auth/verify-email/expired-token`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Verification token has expired');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send a password reset email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Token sent to email');

      // Verify the reset token was saved to the user
      const user = await User.findOne({ email: testUser.email });
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
    });

    it('should return 404 if user does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('There is no user with email address');
    });
  });

  describe('PATCH /api/v1/auth/reset-password/:token', () => {
    let resetToken;
    
    beforeEach(async () => {
      // Generate a reset token
      const user = await User.findById(testUser._id);
      resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
    });
    
    it('should reset the password with a valid token', async () => {
      const newPassword = 'newpassword123';
      
      const res = await request(app)
        .patch(`/api/v1/auth/reset-password/${resetToken}`)
        .send({
          password: newPassword,
          passwordConfirm: newPassword
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      
      // Verify the password was updated
      const updatedUser = await User.findById(testUser._id).select('+password');
      const isPasswordCorrect = await updatedUser.correctPassword(newPassword, updatedUser.password);
      expect(isPasswordCorrect).toBe(true);
      
      // Verify the reset token was cleared
      expect(updatedUser.passwordResetToken).toBeUndefined();
      expect(updatedUser.passwordResetExpires).toBeUndefined();
    });
    
    it('should return 400 with an invalid token', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/reset-password/invalid-token')
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Token is invalid or has expired');
    });
    
    it('should return 400 if passwords do not match', async () => {
      const res = await request(app)
        .patch(`/api/v1/auth/reset-password/${resetToken}`)
        .send({
          password: 'newpassword123',
          passwordConfirm: 'differentpassword'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Passwords do not match');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get the current authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user._id).toBe(testUser._id.toString());
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();
    });
    
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('You are not logged in');
    });
  });

  describe('PATCH /api/v1/auth/update-me', () => {
    it('should update the current user', async () => {
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com',
        photo: 'updated-photo.jpg'
      };
      
      const res = await request(app)
        .patch('/api/v1/auth/update-me')
        .set('Authorization', `Bearer ${testToken}`)
        .send(updates);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.name).toBe(updates.name);
      expect(res.body.data.user.email).toBe(updates.email.toLowerCase());
      expect(res.body.data.user.photo).toBe(updates.photo);
      
      // Verify the user was updated in the database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe(updates.name);
      expect(updatedUser.email).toBe(updates.email.toLowerCase());
      expect(updatedUser.photo).toBe(updates.photo);
    });
    
    it('should not allow updating password through this route', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/update-me')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('This route is not for password updates');
    });
  });

  describe('PATCH /api/v1/auth/update-password', () => {
    it('should update the current user\'s password', async () => {
      const currentPassword = 'test1234';
      const newPassword = 'newsecurepass123';
      
      const res = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword,
          password: newPassword,
          passwordConfirm: newPassword
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      
      // Verify the password was updated
      const updatedUser = await User.findById(testUser._id).select('+password');
      const isPasswordCorrect = await updatedUser.correctPassword(newPassword, updatedUser.password);
      expect(isPasswordCorrect).toBe(true);
    });
    
    it('should return 401 if current password is incorrect', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'wrongpassword',
          password: 'newpassword123',
          passwordConfirm: 'newpassword123'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Your current password is incorrect');
    });
    
    it('should return 400 if new password is the same as current password', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          currentPassword: 'test1234',
          password: 'test1234', // Same as current password
          passwordConfirm: 'test1234'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('New password must be different from current password');
    });
  });

  describe('DELETE /api/v1/auth/delete-me', () => {
    it('should deactivate the current user account', async () => {
      // Create a user to delete
      const { user, token } = await createTestUser({
        email: 'todelete@example.com',
        name: 'User To Delete'
      });
      
      const res = await request(app)
        .delete('/api/v1/auth/delete-me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(204);
      
      // Verify the user is deactivated
      const deletedUser = await User.findById(user._id);
      expect(deletedUser.active).toBe(false);
    });
    
    it('should not allow deactivating with active bookings', async () => {
      // Create a user with an active booking
      const { user, token } = await createTestUser({
        email: 'withbooking@example.com',
        name: 'User With Booking'
      });
      
      // Create a booking for the user
      const tour = await createTestTour({
        name: 'Tour for Booking Test',
        price: 199
      });
      
      await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user: user._id,
          tour: tour._id,
          price: tour.price,
          status: 'confirmed'
        });
      
      const res = await request(app)
        .delete('/api/v1/auth/delete-me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('User has active bookings');
    });
  });

  describe('GET /api/v1/auth/logout', () => {
    it('should log out the current user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      
      // Check if the JWT cookie was cleared
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('jwt=loggedOut'))).toBeTruthy();
    });
    
    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/v1/auth/logout');
      
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('You are not logged in');
    });
  });
});
