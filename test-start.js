// Test script to verify backend startup
const { exec } = require('child_process');
const path = require('path');

// Set environment variables for testing
process.env.PORT = '3000';
process.env.NODE_ENV = 'development';
process.env.MONGODB_URI = 'mongodb://localhost:27017/28degrees-test';
process.env.JWT_SECRET = 'test-jwt-secret';

console.log('🚀 Starting backend server for testing...');
console.log(`📂 Using directory: ${__dirname}`);

// Start the server
const server = exec('node backend/server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Error executing server: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.error(`stderr: ${stderr}`);
});

// Log server output
server.stdout.on('data', (data) => {
  console.log(`[Server] ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`[Server Error] ${data}`);
});

// Handle server exit
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down test server...');
  server.kill();
  process.exit(0);
});
