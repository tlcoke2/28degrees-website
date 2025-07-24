import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Source and destination paths
const srcPath = join(__dirname, '..', 'public', '_redirects');
const destPath = join(__dirname, '..', 'dist', '_redirects');

// Ensure destination directory exists
const destDir = dirname(destPath);
if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

// Copy _redirects file
copyFileSync(srcPath, destPath);
console.log('Copied _redirects file to dist directory');
