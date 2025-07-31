import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const { join } = path;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = join(__dirname, '.env');

// Update the MongoDB URI to use local instance
const envContent = `# Server Configuration
NODE_ENV=development
PORT=5000

# JWT Configuration
JWT_SECRET=28degrees_jwt_secret_key_should_be_long_and_secure_123!
JWT_EXPIRE=90d
JWT_COOKIE_EXPIRE=90

# Database - Using local MongoDB instance
MONGODB_URI=mongodb://localhost:27017/28degrees

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend
FRONTEND_URL=http://localhost:3000
`;

// Write the updated .env file
await writeFile(envPath, envContent, 'utf8');
console.log('✅ Updated .env file to use local MongoDB instance');
