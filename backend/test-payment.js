import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function registerTestUser() {
  try {
    console.log('Registering a new test user...');
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Payment Test User',
        email: `payment-test-${Date.now()}@example.com`,
        password: 'Test@1234',
        passwordConfirm: 'Test@1234',
        role: 'user'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to register test user');
    }
    
    console.log('✅ Test user registered successfully');
    return data.token;
  } catch (error) {
    console.error('❌ Error registering test user:', error.message);
    throw error;
  }
}

async function loginTestUser(email, password) {
  try {
    console.log('Logging in test user...');
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to login test user');
    }
    
    console.log('✅ User logged in successfully');
    return data.token;
  } catch (error) {
    console.error('❌ Error logging in test user:', error.message);
    throw error;
  }
}

async function createPaymentIntent(token, paymentData) {
  try {
    console.log('\nCreating payment intent...');
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment intent');
    }
    
    console.log('✅ Payment intent created successfully');
    return data;
  } catch (error) {
    console.error('❌ Error creating payment intent:', error.message);
    throw error;
  }
}

async function confirmPayment(token, paymentIntentId) {
  try {
    console.log('\nConfirming payment...');
    const response = await fetch(`${API_BASE_URL}/api/v1/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        paymentIntentId,
        paymentMethod: 'pm_card_visa' // Using Stripe test card
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to confirm payment');
    }
    
    console.log('✅ Payment confirmed successfully');
    return data;
  } catch (error) {
    console.error('❌ Error confirming payment:', error.message);
    throw error;
  }
}

async function testPayment() {
  try {
    // Register and login a test user
    const token = await registerTestUser();
    console.log('Using JWT token:', token.substring(0, 20) + '...');

    // Test data for the payment
    const paymentData = {
      amount: 1999, // $19.99 in cents
      currency: 'usd',
      description: 'Test Payment',
      metadata: {
        test: 'true',
        userId: 'test-user-123',
        itemId: 'test-item-456'
      }
    };

    // Create payment intent
    const { clientSecret, paymentIntent } = await createPaymentIntent(token, paymentData);
    console.log('Payment Intent ID:', paymentIntent.id);
    console.log('Client Secret:', clientSecret.substring(0, 20) + '...');

    // Confirm the payment
    const confirmedPayment = await confirmPayment(token, paymentIntent.id);
    console.log('Payment Status:', confirmedPayment.status);
    console.log('Payment Details:', JSON.stringify(confirmedPayment, null, 2));

    console.log('\n✅ Payment flow test completed successfully!');
  } catch (error) {
    console.error('\n❌ Payment test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testPayment();
