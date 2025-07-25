// This plugin removes the base path from asset URLs in the built HTML file
// to ensure they work correctly on the custom domain
const fs = require('fs');
const path = require('path');

export default function fixAssetPaths() {
  return {
    name: 'fix-asset-paths',
    closeBundle() {
      try {
        const indexPath = path.resolve(__dirname, 'dist', 'index.html');
        let html = fs.readFileSync(indexPath, 'utf8');
        
        // Remove the base path from all asset URLs
        html = html
          .replace(/\/28degrees-website\/assets\//g, '/assets/')
          .replace(/<base href="\/28degrees-website\/"\s*\/>/g, '<base href="/" />');
        
        fs.writeFileSync(indexPath, html, 'utf8');
        console.log('Fixed asset paths in index.html');
      } catch (error) {
        console.error('Error fixing asset paths:', error);
      }
    }
  };
}
