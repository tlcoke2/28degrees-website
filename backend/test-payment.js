import fetch from 'node-fetch';

async function registerTestUser() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/register', {
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

async function testPayment() {
  try {
    // Register a new test user and get a fresh JWT token
    console.log('Registering a new test user...');
    const token = await registerTestUser();
    console.log('Using JWT token:', token.substring(0, 20) + '...');

    // Test data for the payment
    const paymentData = {
      amount: 1999, // $19.99 in cents
      currency: 'usd',
      metadata: {
        tourId: 'test-tour-123',
        userId: 'test-user-123'
      }
    };

    console.log('Sending payment intent request...');
    const response = await fetch('http://localhost:5000/api/v1/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Successfully created payment intent');
      console.log('Client secret:', data.clientSecret);
    } else {
      console.error('❌ Error creating payment intent:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPayment();
