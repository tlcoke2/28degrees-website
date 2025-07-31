// Simple script to verify Stripe configuration
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Stripe Configuration Verification');
console.log('-------------------------------');
console.log(`STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? '✅ Set' : '❌ Not set'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);

// Test Stripe client initialization
try {
  if (process.env.STRIPE_SECRET_KEY) {
    const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe client initialized successfully');
  } else {
    console.log('❌ STRIPE_SECRET_KEY is not set in .env file');
  }
} catch (error) {
  console.error('❌ Error initializing Stripe client:', error.message);
}
