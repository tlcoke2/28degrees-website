import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = process.env.NODE_ENV === 'production' 
  ? resolve(__dirname, '../.env.production')
  : resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const API_URL = process.env.VITE_API_URL || 'https://api.28degreeswest.com';
const TEST_ENDPOINTS = [
  '/api/health',
  '/api/auth/status',
  '/api/admin/status'
];

// Security headers to check
const SECURITY_HEADERS = [
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'x-xss-protection',
  'content-security-policy',
  'referrer-policy'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, API_URL).toString();
    console.log(`\n🔍 Testing endpoint: ${url}`);
    
    const startTime = Date.now();
    const req = https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      const result = {
        url,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        responseTime: `${responseTime}ms`,
        headers: {},
        securityHeaders: {}
      };
      
      // Get all headers
      Object.entries(res.headers).forEach(([key, value]) => {
        result.headers[key] = value;
        
        // Check security headers
        const lowerKey = key.toLowerCase();
        if (SECURITY_HEADERS.includes(lowerKey)) {
          result.securityHeaders[key] = value;
        }
      });
      
      // Check for CORS headers
      if (res.headers['access-control-allow-origin']) {
        result.cors = {
          allowedOrigins: res.headers['access-control-allow-origin'],
          allowedMethods: res.headers['access-control-allow-methods'],
          allowedHeaders: res.headers['access-control-allow-headers']
        };
      }
      
      // Collect response data
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          result.data = JSON.parse(data);
        } catch (e) {
          result.data = data;
        }
        resolve(result);
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        error: error.message,
        code: error.code
      });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Backend Connectivity & Security Tests');
  console.log(`🌐 API Base URL: ${API_URL}`);
  console.log('='.repeat(60));
  
  const results = [];
  
  // Test each endpoint
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    console.log(`\n📋 Results for ${endpoint}:`);
    console.log(`- Status: ${result.statusCode} ${result.statusMessage}`);
    console.log(`- Response Time: ${result.responseTime}`);
    
    if (result.error) {
      console.error(`❌ Error: ${result.error} (${result.code})`);
      continue;
    }
    
    // Show security headers
    const securityHeaders = Object.keys(result.securityHeaders);
    if (securityHeaders.length > 0) {
      console.log('\n🔒 Security Headers:');
      securityHeaders.forEach(header => {
        console.log(`  - ${header}: ${result.securityHeaders[header]}`);
      });
    } else {
      console.warn('⚠️  No security headers detected');
    }
    
    // Show CORS info if available
    if (result.cors) {
      console.log('\n🔄 CORS Configuration:');
      console.log(`  - Allowed Origins: ${result.cors.allowedOrigins || 'None'}`);
      console.log(`  - Allowed Methods: ${result.cors.allowedMethods || 'Not specified'}`);
      console.log(`  - Allowed Headers: ${result.cors.allowedHeaders || 'Not specified'}`);
    }
    
    console.log('='.repeat(60));
  }
  
  // Generate summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => !r.error && r.statusCode >= 200 && r.statusCode < 300).length;
  const errorCount = results.length - successCount;
  
  console.log(`✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${errorCount}/${results.length}`);
  
  if (errorCount > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => r.error || (r.statusCode && (r.statusCode < 200 || r.statusCode >= 300)))
      .forEach((r, i) => {
        console.log(`\n${i + 1}. ${r.url}`);
        if (r.error) console.log(`   Error: ${r.error} (${r.code})`);
        else console.log(`   Status: ${r.statusCode} ${r.statusMessage}`);
      });
  }
  
  // Check for missing security headers across all responses
  const allSecurityHeaders = new Set();
  results.forEach(r => {
    Object.keys(r.securityHeaders || {}).forEach(h => allSecurityHeaders.add(h));
  });
  
  const missingHeaders = SECURITY_HEADERS.filter(h => !Array.from(allSecurityHeaders).some(sh => sh.toLowerCase() === h));
  
  if (missingHeaders.length > 0) {
    console.log('\n⚠️  Missing Recommended Security Headers:');
    missingHeaders.forEach(h => console.log(`  - ${h}`));
    console.log('\n💡 Recommendation: Add these headers to your backend responses for better security.');
  }
  
  console.log('\n✨ Test completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Unhandled error during tests:', error);
  process.exit(1);
});
