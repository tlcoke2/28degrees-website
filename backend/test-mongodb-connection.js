import mongoose from 'mongoose';

// Test connection with different connection string formats
const testConnections = async () => {
  const connectionStrings = [
    // Current connection string
    'mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/production?authSource=admin',
    
    // Alternative with direct authSource
    'mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/production?authSource=admin&ssl=true',
    
    // Alternative with retryWrites and w=majority
    'mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/production?authSource=admin&retryWrites=true&w=majority&ssl=true'
  ];

  for (const [index, uri] of connectionStrings.entries()) {
    console.log(`\n🔍 Testing connection ${index + 1}:`);
    console.log(uri.replace(/:([^:]+)@/, ':[HIDDEN_PASSWORD]@'));
    
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ Connected successfully!');
      
      // Check admin user
      const User = mongoose.model('User', new mongoose.Schema({}), 'users');
      const adminUser = await User.findOne({ email: 'admin@28degreeswest.com' });
      console.log('Admin user exists:', adminUser ? 'Yes' : 'No');
      
      await mongoose.connection.close();
      console.log('✅ Connection closed');
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      
      // Try to close connection if it was partially opened
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    }
  }
};

testConnections().catch(console.error);
