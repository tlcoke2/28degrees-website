const fs = require('fs');
const path = require('path');

// Source and destination paths
const srcPath = path.join(__dirname, '..', 'public', '_redirects');
const destPath = path.join(__dirname, '..', 'dist', '_redirects');

// Ensure destination directory exists
const destDir = path.dirname(destPath);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy _redirects file
fs.copyFileSync(srcPath, destPath);
console.log('Copied _redirects file to dist directory');
