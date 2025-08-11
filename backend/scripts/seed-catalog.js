import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import CatalogItem from '../src/models/CatalogItem.model.js';

await connectDB();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  console.log('Connecting to', uri.replace(/\/\/([^:]+):[^@]+@/, '//$1:****@'));
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  const seed = [
    { type: 'tour', name: 'South Coast Explorer', priceCents: 9900, currency: 'usd', duration: 'Full Day', active: true },
    { type: 'event', name: 'Reggae Sunset Party', priceCents: 15000, currency: 'usd', date: new Date(Date.now() + 86400000 * 30), active: true },
    { type: 'vip', name: 'Luxury Yacht Day', priceCents: 65000, currency: 'usd', duration: 'Full Day', active: true },
    { type: 'product', name: 'Airport Transfer (Round Trip)', priceCents: 12000, currency: 'usd', active: true },
  ];

  // Upsert by slug/name to avoid duplicates if re-run
  for (const item of seed) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    await CatalogItem.findOneAndUpdate(
      { slug },
      { ...item, slug },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const count = await CatalogItem.countDocuments();
  console.log('Catalog item count:', count);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
