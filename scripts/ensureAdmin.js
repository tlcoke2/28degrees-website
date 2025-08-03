import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configure dotenv to load .env.production
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.production') });

const ADMIN_EMAIL = 'admin@28degreeswest.com';

async function ensureAdmin() {
  try {
    console.log('Starting admin user check...');
    
    // Skip Firebase Admin initialization for now
    console.log('Skipping Firebase Admin initialization (not configured for this environment)');
    
    // Use a placeholder UID since we're not using Firebase Admin
    const firebaseUid = 'admin-user-placeholder-id';

    // 2. Try to connect to MongoDB if URI is available
    if (process.env.MONGODB_URI) {
      console.log('Attempting to connect to MongoDB...');
      const client = new MongoClient(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        socketTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      
      try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        const usersCollection = db.collection('users');
        
        console.log(`Checking if admin user exists in MongoDB...`);
        const existingUser = await usersCollection.findOne({ email: ADMIN_EMAIL });
        
        if (!existingUser) {
          console.log('Creating admin user in MongoDB...');
          await usersCollection.insertOne({
            name: 'Admin',
            email: ADMIN_EMAIL,
            role: 'admin',
            firebaseUid: firebaseUid,
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
