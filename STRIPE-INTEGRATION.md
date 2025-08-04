# Stripe Payment Integration

This document outlines the Stripe payment integration in the 28 Degrees West application, including setup instructions and testing procedures.

## Components

### Frontend
1. **StripePaymentWrapper** (`src/components/Payment/StripePaymentWrapper.tsx`)
   - Handles Stripe Elements provider and error states
   - Wraps the payment form with Stripe Elements

2. **PaymentForm** (`src/components/Payment/PaymentForm.tsx`)
   - Collects payment details
   - Handles form submission and error states
   - Communicates with backend for payment processing

3. **Test Pages**
   - `/test-payment` - Basic test payment page
   - `/test-stripe` - Advanced test payment page
   - `/test-stripe-integration` - Full integration test page

### Backend
1. **Payment Routes** (`backend/src/routes/payment.routes.js`)
   - `POST /api/v1/payments/create-payment-intent` - Creates a payment intent
   - `POST /api/v1/payments/confirm` - Confirms a payment
   - `POST /api/v1/payments/webhook` - Handles Stripe webhooks

2. **Test Script** (`backend/test-payment.js`)
   - End-to-end test of the payment flow
   - Can be run with `node test-payment.js`

## Environment Variables

### Frontend
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://api.28degreeswest.com
```

### Backend
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MONGODB_URI=mongodb://...
JWT_SECRET=...
JWT_EXPIRES_IN=90d
```

## Testing the Integration

### 1. Local Testing

1. Start the backend server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Access the test pages:
   - http://localhost:5173/test-payment
   - http://localhost:5173/test-stripe
   - http://localhost:5173/test-stripe-integration

### 2. Backend Testing

Run the end-to-end test script:
```bash
cd backend
node test-payment.js
```

### 3. Test Credit Cards

Use these test card numbers for payments:

- **Success**: `4242 4242 4242 4242`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

## Deployment

1. Ensure all environment variables are set in your deployment environment
2. Update the `VITE_API_URL` in the frontend to point to your production API
3. Configure Stripe webhooks to point to your production URL
4. Test the payment flow thoroughly in the production environment

## Troubleshooting

### Common Issues

1. **Payment fails with "No such payment intent"**
   - Ensure the payment intent ID is being passed correctly
   - Verify the Stripe secret key is correct

2. **CORS errors**
   - Ensure the frontend URL is in the CORS whitelist
   - Check the backend CORS configuration

3. **Webhook failures**
   - Verify the webhook secret matches
   - Check the Stripe CLI logs for details

## Security Considerations

- Never expose Stripe secret keys in the frontend
- Always use HTTPS in production
- Implement proper error handling and logging
- Regularly rotate API keys and webhook secrets
- Monitor failed payment attempts
