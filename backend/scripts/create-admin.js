// create-admin.js
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  let user = await User.findOne({ email }).select('+password role email');
  if (!user) {
    user = await User.create({
      name: 'Administrator',
      email,
      password,
      passwordConfirm: password, // your schema expects this
      role: 'admin',
    });
    console.log(`✅ Admin created: ${email}`);
  } else {
    // Promote to admin if needed
    if (user.role !== 'admin') {
      await User.updateOne({ _id: user._id }, { $set: { role: 'admin' } });
      console.log(`👑 Existing user promoted to admin: ${email}`);
    } else {
      console.log(`ℹ️ Admin already exists: ${email}`);
    }

    // Optional: reset password if you pass --reset-password
    if (process.argv.includes('--reset-password')) {
      user.password = password;
      user.passwordConfirm = password;
      await user.save();
      console.log('🔐 Admin password reset.');
    }
  }
}

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await mongoose.disconnect(); } catch {}
    process.exit();
  });
