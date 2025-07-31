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

console.log('Stripe Configuration:');
console.log('---------------------');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '***' + process.env.STRIPE_SECRET_KEY.slice(-4) : 'Not set');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '***' : 'Not set');
console.log('---------------------');

// Try to initialize Stripe to test the key
if (process.env.STRIPE_SECRET_KEY) {
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16', // Use the latest API version
    });
    
    // Test the Stripe key by making a simple API call
    await stripe.paymentIntents.list({ limit: 1 });
    console.log('✅ Stripe API key is valid and working');
  } catch (error) {
    console.error('❌ Error testing Stripe API key:', error.message);
  }
} else {
  console.error('❌ STRIPE_SECRET_KEY is not set in the environment variables');
}
