import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

console.log('Environment Variables:');
console.log('---------------------');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'Not set');
console.log('JWT_EXPIRE:', process.env.JWT_EXPIRE || 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***' : 'Not set');
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '***' + process.env.STRIPE_SECRET_KEY.slice(-4) : 'Not set');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? '***' : 'Not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set');
console.log('---------------------');
console.log('Current working directory:', process.cwd());
console.log('Environment file path:', envPath);
console.log('Environment file loaded successfully:', result.parsed ? 'Yes' : 'No');
