const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function deploy() {
  try {
    console.log('Building the project...');
    await execPromise('npm run build');

    console.log('Initializing git repository in dist folder...');
    // Create .nojekyll file to ensure proper GitHub Pages deployment
    await execPromise('echo "" > dist/.nojekyll');
    
    // Initialize git repository and configure user
    await execPromise('cd dist && git init');
    await execPromise('cd dist && git config user.name "GitHub Actions"');
    await execPromise('cd dist && git config user.email "actions@github.com"');
    
    // Add all files and force commit
    await execPromise('cd dist && git add -A');
    await execPromise('cd dist && git commit -m "Deploy to GitHub Pages" --allow-empty');
    
    // Add GitHub repository as a remote
    await execPromise('cd dist && git remote add origin https://github.com/tlcoke2/28degrees-website.git');
    
    // Force push to gh-pages branch
    console.log('Pushing to gh-pages branch...');

    console.log('Pushing to gh-pages branch using HTTPS...');
    // Using HTTPS URL for the repository with credentials in URL
    const repoUrl = 'https://github.com/tlcoke2/28degrees-website.git';
    await execPromise(`cd dist && git push -f ${repoUrl} master:gh-pages`);
    
    console.log('Successfully deployed to GitHub Pages!');
    console.log('Your site should be live at: https://tlcoke2.github.io/28degrees-website');
    console.log('Note: You may be prompted for your GitHub credentials.');
  } catch (error) {
    console.error('Deployment failed:', error);
    console.log('\nTroubleshooting Tips:');
    console.log('1. Make sure you have the correct access to the repository');
    console.log('2. You might need to enter your GitHub credentials when prompted');
    console.log('3. Check if you have 2FA enabled and use a personal access token as password');
    process.exit(1);
  }
}

deploy();
