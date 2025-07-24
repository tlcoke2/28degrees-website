import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to copy files recursively
const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

console.log('Starting deployment to GitHub Pages...');

// 1. Build the project
console.log('Step 1: Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// 2. Create a temporary directory for the deployment
const tempDir = path.join(process.cwd(), 'deploy-temp');
const distDir = path.join(process.cwd(), 'dist');

console.log('Step 2: Preparing deployment files...');
try {
  // Create or clean the temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy dist files to temp directory
  copyRecursiveSync(distDir, tempDir);
  console.log('Deployment files prepared!');

  // 3. Initialize a git repository in the temp directory
  console.log('Step 3: Initializing git repository...');
  process.chdir(tempDir);
  execSync('git init', { stdio: 'inherit' });
  
  // 4. Add all files and make initial commit
  console.log('Step 4: Committing files...');
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages"', { stdio: 'inherit' });
  
  // 5. Add the GitHub Pages remote
  console.log('Step 5: Adding GitHub Pages remote...');
  const repoUrl = 'https://github.com/tlcoke2/28degrees-website.git';
  execSync(`git remote add origin ${repoUrl}`, { stdio: 'inherit' });
  
  // 6. Force push to the gh-pages branch
  console.log('Step 6: Pushing to GitHub Pages...');
  execSync('git push -f origin HEAD:gh-pages', { stdio: 'inherit' });
  
  console.log('\n🎉 Successfully deployed to GitHub Pages!');
  console.log('Your site should be live at: https://tlcoke2.github.io/28degrees-website');
  
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
} finally {
  // Clean up the temp directory
  try {
    process.chdir(__dirname);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (cleanupError) {
    console.error('Error during cleanup:', cleanupError);
  }
}
