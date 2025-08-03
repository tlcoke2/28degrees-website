import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://mongo:VmAaZFvcjCmkndurOTQrlZQtVIVtekIL@centerbeam.proxy.rlwy.net:30897/production?authSource=admin';

async function inspectDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📂 Collections in database:');
    console.log(collections.map(c => `- ${c.name}`).join('\n'));

    // Check each collection for users
    for (const collection of collections) {
      try {
        const docs = await mongoose.connection.db.collection(collection.name).find({}).limit(1).toArray();
        if (docs.length > 0) {
          console.log(`\n📝 Sample document from ${collection.name}:`);
          console.log(JSON.stringify(docs[0], null, 2));
        }
      } catch (e) {
        console.error(`❌ Error reading collection ${collection.name}:`, e.message);
      }
    }

    // Try to find any user
    const allCollections = collections.map(c => c.name);
    for (const collName of allCollections) {
      try {
        const user = await mongoose.connection.db.collection(collName).findOne({
          email: 'admin@28degreeswest.com'
        });
        if (user) {
          console.log(`\n🔍 Found admin user in collection ${collName}:`);
          console.log(user);
        }
      } catch (e) {
        // Ignore errors for collections that don't have an email field
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

inspectDatabase().catch(console.error);
