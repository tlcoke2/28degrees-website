// This script fixes the asset paths in the built index.html file
// It should be run after the build process
const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');

// Read the built index.html file
let html = fs.readFileSync(indexPath, 'utf8');

// Remove the base path from all asset URLs
html = html
  .replace(/\/28degrees-website\/assets\//g, '/assets/')
  .replace(/<base href="\/28degrees-website\/"\s*\/>/g, '<base href="/" />');

// Write the fixed HTML back to the file
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Fixed asset paths in index.html');
