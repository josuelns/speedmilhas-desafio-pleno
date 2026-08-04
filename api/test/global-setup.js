const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_PORTS = [3000, 3010];
const STATE_FILE = path.join(__dirname, 'e2e-servers.json');

async function isPortResponding(port) {
  try {
    await fetch(`http://localhost:${port}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(3000),
    });

    return true;
  } catch {
    return false;
  }
}

async function waitForPort(port, maxAttempts = 40) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (await isPortResponding(port)) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  throw new Error(`API na porta ${port} não respondeu a tempo`);
}

module.exports = async function globalSetup() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

  const apiDir = path.join(__dirname, '..');
  const mainPath = path.join(apiDir, 'dist', 'main.js');
  const spawnedPids = [];

  if (!fs.existsSync(mainPath)) {
    execSync('npm run build', { cwd: apiDir, stdio: 'inherit' });
  }

  for (const port of API_PORTS) {
    if (await isPortResponding(port)) {
      continue;
    }

    const child = spawn(process.execPath, [mainPath], {
      cwd: apiDir,
      env: { ...process.env, PORT: String(port) },
      stdio: 'pipe',
    });

    if (!child.pid) {
      throw new Error(`Não foi possível iniciar a API na porta ${port}`);
    }

    spawnedPids.push({ port, pid: child.pid });
    await waitForPort(port);
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify({ spawnedPids }));
};
