import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

// Read the current .env file
let envContent = `# Server Configuration
NODE_ENV=development
PORT=5000

# JWT Configuration
JWT_SECRET=28degrees_jwt_secret_key_should_be_long_and_secure_123!
JWT_EXPIRE=90d
JWT_COOKIE_EXPIRE=90

# Database - Using local MongoDB instance with additional options
MONGODB_URI=mongodb://127.0.0.1:27017/28degrees?directConnection=true&serverSelectionTimeoutMS=2000

# Stripe
# IMPORTANT: Replace the placeholder below with your actual Stripe secret key
# Get it from: https://dashboard.stripe.com/apikeys
# It should start with 'sk_test_' for test mode
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend
FRONTEND_URL=http://localhost:3000
`;

// Write the updated .env file
await writeFile(envPath, envContent, 'utf8');
console.log('✅ Updated .env file with Stripe key placeholder');
console.log('\nIMPORTANT: Please update the STRIPE_SECRET_KEY in the .env file with your actual Stripe secret key');
console.log('Get your Stripe secret key from: https://dashboard.stripe.com/apikeys');
console.log('The key should start with \'sk_test_\' for test mode');
