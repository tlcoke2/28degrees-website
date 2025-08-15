import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/user.model.js';

// Load environment variables
dotenv.config();

// MongoDB connection URL
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/28degrees?authSource=admin';

// Admin user details
const ADMIN_EMAIL = 'admin@28degreeswest.com';
const ADMIN_PASSWORD = 'Admin@1234!'; // Strong password for admin
const ADMIN_NAME = 'Admin User';

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL, role: 'admin' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      console.log('You can use these credentials to log in to the admin panel.');
      process.exit(0);
    }

    // Create new admin user
    console.log('Creating admin user...');
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    const adminUser = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      active: true
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('\nAdmin Credentials:');
    console.log('------------------');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the function
createAdminUser();
