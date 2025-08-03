import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testMongoDB() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Provided' : 'Not provided');
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });

    const db = mongoose.connection;
    
    db.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });

    db.once('open', () => {
      console.log(`✅ Successfully connected to MongoDB: ${db.name} @ ${db.host}`);
      console.log('Collections in database:', db.collections ? 'Available' : 'Not available');
      process.exit(0);
    });

    // Close connection after a short delay
    setTimeout(() => {
      console.log('Closing MongoDB connection...');
      mongoose.connection.close();
    }, 5000);

  } catch (error) {
    console.error('❌ Error testing MongoDB connection:', error);
    process.exit(1);
  }
}

testMongoDB();
