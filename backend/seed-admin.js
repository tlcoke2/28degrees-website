import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/production?authSource=admin';

// Admin user data
const adminUser = {
  name: 'Admin User',
  email: 'admin@28degreeswest.com',
  password: 'pass1234',
  role: 'admin',
  active: true
};

async function seedAdmin() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if User model exists, if not create it
    let User;
    try {
      User = mongoose.model('User');
    } catch (e) {
      // Define User model if it doesn't exist
      const userSchema = new mongoose.Schema({
        name: String,
        email: { type: String, unique: true },
        password: String,
        role: { type: String, default: 'user' },
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      });
      User = mongoose.model('User', userSchema, 'users');
    }

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists. Updating password...');
      existingAdmin.password = await bcrypt.hash(adminUser.password, 12);
      await existingAdmin.save();
      console.log('✅ Admin user password updated');
    } else {
      // Hash password
      adminUser.password = await bcrypt.hash(adminUser.password, 12);
      
      // Create admin user
      await User.create(adminUser);
      console.log('✅ Admin user created successfully');
    }
    
    console.log('\n🔑 Admin Credentials:');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Password: pass1234`);
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedAdmin().catch(console.error);
