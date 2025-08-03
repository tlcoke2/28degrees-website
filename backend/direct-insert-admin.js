import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/production?authSource=admin';

async function insertAdminUser() {
  const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@28degreeswest.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists. Updating password...');
      await usersCollection.updateOne(
        { _id: existingAdmin._id },
        { $set: { 
          password: await bcrypt.hash('pass1234', 12),
          role: 'admin',
          active: true
        }}
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('pass1234', 12);
      
      const result = await usersCollection.insertOne({
        name: 'Admin User',
        email: 'admin@28degreeswest.com',
        password: hashedPassword,
        role: 'admin',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Admin user created successfully');
      console.log('Inserted ID:', result.insertedId);
    }

    // Verify the user was inserted/updated
    const admin = await usersCollection.findOne({ email: 'admin@28degreeswest.com' });
    console.log('\n🔍 Admin user details:');
    console.log({
      _id: admin._id,
      email: admin.email,
      role: admin.role,
      active: admin.active,
      createdAt: admin.createdAt
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.writeErrors) {
      console.error('Write errors:', error.writeErrors);
    }
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

insertAdminUser().catch(console.error);
