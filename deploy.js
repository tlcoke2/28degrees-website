const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function deploy() {
  try {
    console.log('Building the project...');
    await execPromise('npm run build');

    console.log('Initializing git repository in dist folder...');
    await execPromise('cd dist && git init && git add -A');
    await execPromise('cd dist && git commit -m "Deploy to GitHub Pages"');

    console.log('Pushing to gh-pages branch...');
    await execPromise('cd dist && git push -f git@github.com:tlcoke2/28degrees-website.git master:gh-pages');
    
    console.log('Successfully deployed to GitHub Pages!');
    console.log('Your site should be live at: https://tlcoke2.github.io/28degrees-website');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

deploy();
