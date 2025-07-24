// Jest configuration for ESM support
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  
  // Module name mapper for ESM imports
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Ignore node_modules except for specific packages if needed
  transformIgnorePatterns: [
    'node_modules/(?!(.*)/)'
  ],
  
  // Test timeout and other settings
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'jsx', 'node'],
  
  // Setup file for test environment
  setupFilesAfterEnv: ['./tests/setup.js'],
  
  // Global configuration
  globals: {
    'babel-jest': {
      useESM: true,
    },
  },
};
