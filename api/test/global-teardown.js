const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function killProcess(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      return;
    }

    process.kill(pid, 'SIGTERM');
  } catch {
    // Processo já encerrado.
  }
}

module.exports = async function globalTeardown() {
  const stateFile = path.join(__dirname, 'e2e-servers.json');

  if (!fs.existsSync(stateFile)) {
    return;
  }

  const { spawnedPids } = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

  for (const { pid } of spawnedPids) {
    killProcess(pid);
  }

  fs.unlinkSync(stateFile);
};
