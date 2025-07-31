import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');

// Load environment variables from .env file
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

console.log('Environment Variables:');
console.log('---------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***' + process.env.MONGODB_URI.slice(-20) : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'Not set');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '***' + process.env.STRIPE_SECRET_KEY.slice(-4) : 'Not set');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '***' : 'Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('---------------------');

// Check if Stripe secret key is set and valid
if (process.env.STRIPE_SECRET_KEY) {
  console.log('Stripe secret key is set');
  
  // Check if it looks like a valid Stripe secret key
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('✅ Stripe secret key appears to be valid (starts with sk_test_)');
  } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    console.log('⚠️  WARNING: Using a LIVE Stripe secret key in development');
  } else if (process.env.STRIPE_SECRET_KEY.startsWith('pk_')) {
    console.error('❌ ERROR: Found a Stripe publishable key (pk_*) instead of a secret key');
  } else {
    console.error('❌ ERROR: Stripe secret key does not match expected format');
  }
} else {
  console.error('❌ ERROR: STRIPE_SECRET_KEY is not set in .env file');
}
