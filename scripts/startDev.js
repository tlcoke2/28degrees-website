const { execSync, spawn } = require('child_process');
const open = require('open');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

(async () => {
  run('npm install');
  const dev = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  await open('http://localhost:5173');
  dev.on('close', code => process.exit(code ?? 0));
})();
