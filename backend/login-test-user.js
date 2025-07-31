import fetch from 'node-fetch';

async function loginTestUser() {
  try {
    const response = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'Test@1234'
      })
    });

    const data = await response.json();
    console.log('Response:', {
      status: response.status,
      statusText: response.statusText,
      data
    });
    
    if (response.ok) {
      console.log('✅ Successfully logged in test user');
      console.log('Token:', data.token);
      
      // Save token to a file for future use
      const fs = await import('fs').then(m => m.promises);
      await fs.writeFile('test-user-token.txt', data.token);
      console.log('✅ Token saved to test-user-token.txt');
      
      return data.token;
    } else {
      console.error('❌ Error logging in test user:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

loginTestUser();
