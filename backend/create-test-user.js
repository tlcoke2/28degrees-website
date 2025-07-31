import fetch from 'node-fetch';

async function createTestUser() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'Test@1234',
        passwordConfirm: 'Test@1234',
        role: 'user'
      })
    });

    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ Test user created successfully');
      console.log('Token:', data.token);
    } else {
      console.error('❌ Error creating test user:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();
