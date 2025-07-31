// Simple script to test MongoDB connection
import mongoose from 'mongoose';

export async function testMongoConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Use the same connection string as in your .env file
    const mongoUri = 'mongodb://localhost:27017/28degrees';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure MongoDB is installed and running locally');
    console.log('2. Check if the MongoDB service is running (run `mongod --version` and `mongod` in a terminal)');
    console.log('3. Verify the connection string in your .env file (MONGODB_URI)');
    console.log('4. Try connecting with MongoDB Compass or mongo shell to verify credentials');
    process.exit(1);
  }
}

testMongoConnection();
