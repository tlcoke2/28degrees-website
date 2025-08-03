// Test script to check the production frontend's API configuration
console.log('Testing production frontend API configuration...');

// Function to check the API base URL
function checkApiBaseUrl() {
  console.log('\n🔍 Checking API base URL configuration...');
  
  // Check if the API base URL is set in the environment
  const apiBaseUrl = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 
                   (process && process.env && process.env.VITE_API_BASE_URL) || 
                   'Not set in environment';
  
  console.log('VITE_API_BASE_URL:', apiBaseUrl);
  
  // Try to get the API base URL from the window object (if set in the frontend)
  if (typeof window !== 'undefined') {
    console.log('\n🌐 Checking window object for API configuration...');
    console.log('window.location.hostname:', window.location.hostname);
    console.log('window.location.origin:', window.location.origin);
    
    // Check for common patterns of API URL configuration
    const possibleApiUrls = [
      `${window.location.origin}/api`,
      `https://api.${window.location.hostname}`,
      `https://api-${window.location.hostname}`,
      `https://${window.location.hostname}/api`,
      'https://api.28degreeswest.com',
      'https://28degreeswest.com/api'
    ];
    
    console.log('\n🔗 Possible API endpoints based on current host:');
    possibleApiUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
  }
}

// Check if running in a browser environment
if (typeof window !== 'undefined') {
  // Run the check when the page loads
  window.addEventListener('load', checkApiBaseUrl);
  
  // Also check if there's a global config object
  console.log('\n🔍 Checking for global configuration object...');
  if (window.__APP_CONFIG__) {
    console.log('Found __APP_CONFIG__:', window.__APP_CONFIG__);
  }
  
  // Check for any API service initialization
  console.log('\n🔍 Checking for API service initialization...');
  if (window.api) {
    console.log('Found window.api:', window.api);
  }
} else {
  console.log('\n⚠️ This script is designed to run in a browser environment.');
  console.log('To test the production frontend configuration:');
  console.log('1. Build the frontend with `npm run build`');
  console.log('2. Serve the built files with a local server');
  console.log('3. Open the browser console to see the output');
  
  // Provide additional checks for Node.js environment
  console.log('\n🔍 Checking Node.js environment variables:');
  console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL || 'Not set');
  
  console.log('\n💡 Tip: The production API URL might be set during the build process.');
  console.log('Check your deployment pipeline or build configuration for environment variables.');
}

// Export for testing purposes
export { checkApiBaseUrl };
