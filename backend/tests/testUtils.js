import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.model.js';
import Tour from '../src/models/Tour.model.js';
import Booking from '../src/models/Booking.model.js';
import Review from '../src/models/Review.model.js';

/**
 * Generate a JWT token for testing
 * @param {string} userId - The user ID to generate token for
 * @returns {string} JWT token
 */
export const getAuthToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/**
 * Create a test user and return the user object and auth token
 * @param {Object} userData - User data (optional)
 * @returns {Promise<Object>} User object and auth token
 */
export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'test1234',
    passwordConfirm: 'test1234',
    role: 'user',
    active: true,
    ...userData,
  };

  // Create user
  const user = await User.create(defaultUser);
  
  // Generate token
  const token = getAuthToken(user._id);
  
  return { user, token };
};

/**
 * Create a test admin user and return the user object and auth token
 * @returns {Promise<Object>} Admin user object and auth token
 */
export const createTestAdmin = async () => {
  return createTestUser({
    name: 'Admin User',
    email: 'admin@test.com',
    role: 'admin',
  });
};

/**
 * Create a test tour
 * @param {Object} tourData - Tour data (optional)
 * @param {string} guideId - ID of the guide (optional)
 * @returns {Promise<Object>} Created tour
 */
export const createTestTour = async (tourData = {}, guideId) => {
  const defaultTour = {
    name: 'Test Tour',
    slug: 'test-tour',
    duration: 3,
    maxGroupSize: 10,
    difficulty: 'medium',
    price: 299,
    summary: 'A test tour',
    description: 'A detailed description of the test tour',
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
    ],
    startDates: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)], // 7 days from now
    ...tourData,
  };

  if (guideId) {
    defaultTour.guides = [guideId];
  }

  return await Tour.create(defaultTour);
};

/**
 * Create a test booking
 * @param {string} tourId - ID of the tour
 * @param {string} userId - ID of the user
 * @param {Object} bookingData - Additional booking data (optional)
 * @returns {Promise<Object>} Created booking
 */
export const createTestBooking = async (tourId, userId, bookingData = {}) => {
  const defaultBooking = {
    tour: tourId,
    user: userId,
    price: 299,
    status: 'paid',
    ...bookingData,
  };

  return await Booking.create(defaultBooking);
};

/**
 * Create a test review
 * @param {string} tourId - ID of the tour
 * @param {string} userId - ID of the user
 * @param {Object} reviewData - Additional review data (optional)
 * @returns {Promise<Object>} Created review
 */
export const createTestReview = async (tourId, userId, reviewData = {}) => {
  const defaultReview = {
    review: 'Great tour!',
    rating: 5,
    tour: tourId,
    user: userId,
    ...reviewData,
  };

  return await Review.create(defaultReview);
};

/**
 * Clean up test data from the database
 */
export const cleanupTestData = async () => {
  await User.deleteMany({});
  await Tour.deleteMany({});
  await Booking.deleteMany({});
  await Review.deleteMany({});
};

/**
 * Get the auth header for API requests
 * @param {string} token - JWT token
 * @returns {Object} Authorization header
 */
export const getAuthHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Get the cookies from a response
 * @param {Object} response - SuperTest response object
 * @returns {Object} Cookies
 */
export const getCookies = (response) => {
  const cookies = {};
  const cookieHeaders = response.headers['set-cookie'] || [];
  
  cookieHeaders.forEach((cookie) => {
    const [keyValue] = cookie.split(';');
    const [key, value] = keyValue.split('=');
    cookies[key] = value;
  });
  
  return cookies;
};

export default {
  getAuthToken,
  createTestUser,
  createTestAdmin,
  createTestTour,
  createTestBooking,
  createTestReview,
  cleanupTestData,
  getAuthHeader,
  getCookies,
};
