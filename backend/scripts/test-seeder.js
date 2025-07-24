import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { errorLogger, infoLogger } from '../src/utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import models
import Tour from '../src/models/Tour.model.js';
import User from '../src/models/User.model.js';
import Review from '../src/models/Review.model.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    infoLogger('MongoDB Connected for testing...');
  } catch (err) {
    errorLogger(err, 'database');
    process.exit(1);
  }
};

// Test the database connection and models
const testDatabase = async () => {
  try {
    infoLogger('Starting database tests...');
    
    // Test User model
    const testUser = await User.findOne({ email: 'admin@28degreeswest.com' });
    if (!testUser) {
      throw new Error('Test user not found. Run the seeder first with: npm run seed');
    }
    infoLogger('✅ User model test passed');
    
    // Test Tour model
    const testTour = await Tour.findOne({ slug: 'blue-mountains-adventure' });
    if (!testTour) {
      throw new Error('Test tour not found. Run the seeder first with: npm run seed');
    }
    infoLogger('✅ Tour model test passed');
    
    // Test Review model
    const testReview = await Review.findOne().populate('user').populate('tour');
    if (!testReview) {
      throw new Error('No reviews found. Run the seeder first with: npm run seed');
    }
    infoLogger('✅ Review model test passed');
    
    // Test relationships
    if (!testReview.user || !testReview.tour) {
      throw new Error('Review relationships not properly populated');
    }
    infoLogger('✅ Relationship tests passed');
    
    // Test data counts
    const userCount = await User.countDocuments();
    const tourCount = await Tour.countDocuments();
    const reviewCount = await Review.countDocuments();
    
    infoLogger('\n📊 Database Summary:');
    infoLogger(`👥 Users: ${userCount}`);
    infoLogger(`🌴 Tours: ${tourCount}`);
    infoLogger(`⭐ Reviews: ${reviewCount}`);
    
    if (userCount < 1 || tourCount < 1 || reviewCount < 1) {
      throw new Error('Some collections are empty. Check the seeder.');
    }
    
    infoLogger('\n✅ All database tests passed successfully!');
    process.exit(0);
    
  } catch (err) {
    errorLogger(err, 'test');
    process.exit(1);
  }
};

// Run the tests
const runTests = async () => {
  try {
    await connectDB();
    await testDatabase();
  } catch (err) {
    errorLogger(err, 'test');
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
  }
};

// Execute the tests
runTests();
