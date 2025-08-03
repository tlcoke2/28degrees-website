// Test script to verify admin login with the production backend
import axios from 'axios';

// Production backend URL - update this if different
const API_BASE_URL = 'https://api.28degreeswest.com/api';

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...');
    
    // 1. Attempt to log in with admin credentials
    console.log('\n1. Attempting to log in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
      email: 'admin@28degreeswest.com',
      password: 'pass1234'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Allow redirects
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    console.log('✅ Login Response Status:', loginResponse.status);
    console.log('Response Data:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.data.token) {
      console.log('\n🔑 Login successful! Token received.');
      
      // 2. Test accessing a protected route
      console.log('\n2. Testing protected route access...');
      const protectedResponse = await axios.get(`${API_BASE_URL}/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        },
        validateStatus: (status) => status < 500
      });

      console.log('🔒 Protected Route Status:', protectedResponse.status);
      console.log('User Data:', JSON.stringify(protectedResponse.data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the backend running?');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAdminLogin().catch(console.error);
