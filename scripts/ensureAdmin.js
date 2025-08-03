import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configure dotenv to load .env.production
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? resolve(__dirname, '../.env.production')
  : resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@28degreeswest.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // This would be used if creating a new admin user

async function ensureAdmin() {
  try {
    console.log('🔍 Starting admin user verification...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    console.log('🔌 Connecting to MongoDB...');
    console.log(`Database: ${new URL(process.env.MONGODB_URI).pathname.replace(/^\//, '')}`);
    
    // Generate a consistent UUID for the admin user if needed
    const crypto = await import('crypto');
    const firebaseUid = `admin-${crypto.randomUUID()}`;

    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    try {
      await client.connect();
      console.log('✅ Successfully connected to MongoDB');
      
      const db = client.db();
      const usersCollection = db.collection('users');
      
      console.log(`🔎 Checking for admin user: ${ADMIN_EMAIL}`);
      const existingUser = await usersCollection.findOne({ 
        $or: [
          { email: ADMIN_EMAIL },
          { role: 'admin' }
        ] 
      });
      
      if (existingUser) {
        console.log('✅ Admin user already exists:');
        console.log(`   - Email: ${existingUser.email}`);
        console.log(`   - Role: ${existingUser.role}`);
        console.log(`   - ID: ${existingUser._id}`);
      } else {
        console.log('⚠️  Admin user not found. Creating new admin user...');
        
        const newAdmin = {
          name: 'System Administrator',
          email: ADMIN_EMAIL,
          role: 'admin',
          firebaseUid: firebaseUid,
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
          });
          console.log('✅ Created admin user in MongoDB');
        } else {
          console.log('✅ Admin user already exists in MongoDB');
        }
        
        console.log('\n✅ Admin setup completed successfully in MongoDB!');
      } catch (mongoError) {
        console.warn('⚠️  Could not connect to MongoDB or create admin user:');
        console.warn(mongoError.message);
        console.log('⚠️  Skipping MongoDB admin setup. The application may require manual admin setup.');
      } finally {
        try {
          await client.close();
        } catch (closeError) {
          console.warn('⚠️  Error closing MongoDB connection:', closeError.message);
        }
      }
    } else {
      console.log('⚠️  MONGODB_URI not found in environment. Skipping MongoDB admin setup.');
    }
    
    console.log('\n✅ Admin setup completed with partial success!');
    console.log(`Admin email: ${ADMIN_EMAIL}`);
    console.log('Note: Some setup steps may have been skipped due to missing configurations.');
    console.log('Please ensure the admin user is properly configured in your authentication system.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

// Execute the async function
ensureAdmin().catch(error => {
  console.error('❌ Unhandled error in admin setup:', error);
  process.exit(1);
});
