// Test script to check backend connectivity
import fetch from 'node-fetch';

const API_URL = 'https://api.28degreeswest.com';
const ENDPOINTS = [
  '/api/v1/health',
  '/api/v1/tours',
  '/api/v1/users/me'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🔍 Testing: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '28Degrees-Connectivity-Test/1.0'
      },
      timeout: 10000 // 10 seconds timeout
    });
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log('📋 Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    
    try {
      const data = await response.text();
      console.log('📦 Response:', data.length > 200 ? `${data.substring(0, 200)}...` : data);
    } catch (err) {
      console.log('📦 No response body or failed to parse');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('🔍 Cause:', error.cause.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting 28 Degrees Backend Connectivity Tests');
  console.log('============================================');
  
  for (const endpoint of ENDPOINTS) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n✅ All tests completed');
}

runTests().catch(console.error);
