import 'dotenv/config';
import mongoose from 'mongoose';
import CatalogItem from '../src/models/CatalogItem.model.js';

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI missing');

  await mongoose.connect(mongoUri);

  const seed = [
    { type: 'tour', name: 'South Coast Explorer', priceCents: 9900, currency: 'usd', duration: 'Full Day', active: true },
    { type: 'event', name: 'Reggae Sunset Party', priceCents: 15000, currency: 'usd', date: new Date(Date.now() + 86400000 * 30), active: true },
    { type: 'vip', name: 'Luxury Yacht Day', priceCents: 65000, currency: 'usd', duration: 'Full Day', active: true },
    { type: 'product', name: 'Airport Transfer (Round Trip)', priceCents: 12000, currency: 'usd', active: true },
  ];

  await CatalogItem.deleteMany({});
  const docs = await CatalogItem.insertMany(seed);
  console.log('Seeded catalog items:', docs.map(d => d.name));
  await mongoose.disconnect();
}
run().catch(err => {
  console.error(err);
  process.exit(1);
});
