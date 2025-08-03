import { existsSync, copyFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Setting up SPA routing for GitHub Pages...');

// Paths
const distDir = join(__dirname, '..', 'dist');
const publicDir = join(__dirname, '..', 'public');

// 1. Ensure 404.html exists in the dist directory
const copy404Html = () => {
  const src404 = join(publicDir, '404.html');
  const dest404 = join(distDir, '404.html');
  
  if (existsSync(src404)) {
    copyFileSync(src404, dest404);
    console.log('✅ Copied 404.html to dist directory');
  } else {
    console.warn('⚠️  404.html not found in public directory');
  }
};

// 2. Ensure _headers file is copied to dist directory
const copyHeadersFile = () => {
  const srcHeaders = join(publicDir, '_headers');
  const destHeaders = join(distDir, '_headers');
  
  if (existsSync(srcHeaders)) {
    copyFileSync(srcHeaders, destHeaders);
    console.log('✅ Copied _headers file to dist directory');
  } else {
    console.warn('⚠️  _headers file not found in public directory');
  }
};

// 3. Ensure _redirects file exists in the dist directory
const setupRedirects = () => {
  const redirectsContent = `
# Single Page Apps for GitHub Pages
# https://github.com/rafgraph/spa-github-pages

# Redirect all requests to index.html with a 200 status code
/*    /index.html   200
`;

  const redirectsPath = join(distDir, '_redirects');
  writeFileSync(redirectsPath, redirectsContent.trim());
  console.log('✅ Created _redirects file');
};

// 4. Create a .nojekyll file to prevent Jekyll processing
const createNoJekyll = () => {
  const noJekyllPath = join(distDir, '.nojekyll');
  writeFileSync(noJekyllPath, '');
  console.log('✅ Created .nojekyll file');
};

// Main function
const main = () => {
  try {
    // Create dist directory if it doesn't exist
    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true });
    }

    // Set up all required files
    copy404Html();
    copyHeadersFile();
    setupRedirects();
    createNoJekyll();
    
    console.log('\n✨ SPA routing setup complete!');
    console.log('Your SPA should now work correctly with client-side routing on GitHub Pages.');
    console.log('Deploy your application with `npm run deploy`\n');
  } catch (error) {
    console.error('❌ Error setting up SPA routing:', error);
    process.exit(1);
  }
};

// Run the script
main();
