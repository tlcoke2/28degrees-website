import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Tour from '../models/Tour.model.js';
import User from '../models/User.model.js';
import Review from '../models/Review.model.js';
import { errorLogger, infoLogger } from './logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read JSON files
const tours = JSON.parse(fs.readFileSync(join(__dirname, '../../data/tours.json'), 'utf-8'));
const users = JSON.parse(fs.readFileSync(join(__dirname, '../../data/users.json'), 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(join(__dirname, '../../data/reviews.json'), 'utf-8'));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    infoLogger('MongoDB Connected...');
  } catch (err) {
    errorLogger(err, 'database');
    process.exit(1);
  }
};

// Import data into database
const importData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    
    // Create users (with hashed passwords)
    const createdUsers = await User.create(users, { validateBeforeSave: false });
    
    // Get the admin user ID
    const adminUser = createdUsers.find(user => user.role === 'admin');
    
    // Update tours with the admin user as the guide
    const toursWithGuide = tours.map(tour => ({
      ...tour,
      guides: [adminUser._id],
    }));
    
    // Create tours
    await Tour.create(toursWithGuide);
    
    // Update reviews with actual user IDs
    const sampleUsers = createdUsers.filter(user => user.role === 'user');
    const reviewsWithUsers = reviews.map((review, i) => ({
      ...review,
      user: sampleUsers[i % sampleUsers.length]._id,
    }));
    
    // Create reviews
    await Review.create(reviewsWithUsers);
    
    infoLogger('Data successfully imported!');
    process.exit();
  } catch (err) {
    errorLogger(err, 'seeder');
    process.exit(1);
  }
};

// Delete all data from database
const deleteData = async () => {
  try {
    await connectDB();
    
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    
    infoLogger('Data successfully deleted!');
    process.exit();
  } catch (err) {
    errorLogger(err, 'seeder');
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else {
  console.log('Please provide a valid argument: --import or --delete');
  process.exit(1);
}
