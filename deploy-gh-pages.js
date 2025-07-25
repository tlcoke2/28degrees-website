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
      // Skip node_modules and other unnecessary directories
      if (childItemName !== 'node_modules' && !childItemName.startsWith('.')) {
        copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      }
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

console.log('🚀 Starting deployment to GitHub Pages...');

// 1. Build the project
console.log('🔨 Step 1: Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// 2. Create a temporary directory for the deployment
const tempDir = path.join(process.cwd(), 'deploy-temp');
const distDir = path.join(process.cwd(), 'dist');

console.log('📦 Step 2: Preparing deployment files...');
try {
  // Create or clean the temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Copy dist files to temp directory
  copyRecursiveSync(distDir, tempDir);
  
  // Add .nojekyll file to prevent Jekyll processing
  fs.writeFileSync(path.join(tempDir, '.nojekyll'), '');
  
  // Add CNAME file if it exists in the dist directory
  const cnamePath = path.join(distDir, 'CNAME');
  if (fs.existsSync(cnamePath)) {
    fs.copyFileSync(cnamePath, path.join(tempDir, 'CNAME'));
  }
  
  console.log('✅ Deployment files prepared!');

  // 3. Initialize a git repository in the temp directory
  console.log('🔧 Step 3: Initializing deployment repository...');
  process.chdir(tempDir);
  execSync('git init', { stdio: 'inherit' });
  
  // 4. Add all files and make initial commit
  console.log('💾 Step 4: Committing files...');
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Deploy to GitHub Pages"', { stdio: 'inherit' });
  
  // 5. Deploy to GitHub Pages
  console.log('🚀 Step 5: Deploying to GitHub Pages...');
  
  // Get the GitHub repository URL from package.json or use a default
  let repoUrl = 'https://github.com/tlcoke2/28degrees-website.git';
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'package.json'), 'utf-8'));
    if (packageJson.repository && typeof packageJson.repository === 'string') {
      repoUrl = packageJson.repository;
    } else if (packageJson.repository && packageJson.repository.url) {
      repoUrl = packageJson.repository.url;
    }
  } catch (e) {
    console.log('ℹ️ Using default repository URL');
  }
  
  console.log(`🔗 Using repository URL: ${repoUrl}`);
  
  // Add the remote if it doesn't exist
  try {
    execSync('git remote add origin ' + repoUrl, { stdio: 'ignore' });
  } catch (e) {
    // Remote already exists, update the URL
    execSync('git remote set-url origin ' + repoUrl, { stdio: 'ignore' });
  }
  
  // Force push to the gh-pages branch
  console.log('⬆️  Pushing to GitHub Pages...');
  execSync('git push -f origin HEAD:gh-pages', { stdio: 'inherit' });
  
  console.log('\n🎉 Successfully deployed to GitHub Pages!');
  console.log('🌐 Your site should be live at: https://28degreeswest.com');
  
} catch (error) {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
} finally {
  // Clean up the temp directory
  try {
    process.chdir(__dirname);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (cleanupError) {
    console.error('⚠️  Error during cleanup:', cleanupError);
  }
}
