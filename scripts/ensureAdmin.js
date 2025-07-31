const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.production' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const ADMIN_EMAIL = 'admin@28degreeswest.com';
const ADMIN_PASSWORD = 'Admin@1234!'; // In production, you should use a more secure password

async function ensureAdmin() {
  try {
    console.log('Starting admin user setup...');
    
    // Initialize Firebase Admin
    console.log('Initializing Firebase Admin...');
    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth(firebaseApp);

    // 1. Create/Get Firebase user
    let firebaseUser;
    try {
      console.log(`Checking if admin user (${ADMIN_EMAIL}) exists in Firebase...`);
      firebaseUser = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log('✅ Admin user already exists in Firebase');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('Creating new admin user in Firebase...');
        firebaseUser = await auth.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          emailVerified: true
        });
        console.log('✅ Created admin user in Firebase');
      } else {
        console.error('Error accessing Firebase Auth:', error);
        throw error;
      }
    }

    // 2. Ensure user in MongoDB
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    
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
          firebaseUid: firebaseUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ Created admin user in MongoDB');
      } else {
        console.log('✅ Admin user already exists in MongoDB');
      }

      console.log('\n✅ Admin setup completed successfully!');
      console.log(`Admin email: ${ADMIN_EMAIL}`);
      console.log(`Temporary password: ${ADMIN_PASSWORD}\n`);
      console.log('IMPORTANT: Change this password after first login!');
      
    } finally {
      await client.close();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

ensureAdmin();
