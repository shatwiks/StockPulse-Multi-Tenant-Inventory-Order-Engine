const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const frontendDir = path.join(rootDir, 'frontend');

// 1. Ensure .env files exist
function ensureEnvFiles() {
  const rootEnv = path.join(rootDir, '.env');
  const serverEnv = path.join(serverDir, '.env');
  const frontendEnv = path.join(frontendDir, '.env');

  if (!fs.existsSync(serverEnv)) {
    if (fs.existsSync(rootEnv)) {
      fs.copyFileSync(rootEnv, serverEnv);
      console.log('\x1b[32m[StockPulse]\x1b[0m Created server/.env from root .env');
    }
  }

  if (!fs.existsSync(frontendEnv)) {
    const defaultFrontendEnv = [
      'VITE_API_BASE_URL="http://localhost:3001/api/v1"',
      'NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"',
      'NEXT_PUBLIC_DEFAULT_ORG_ID="8fca3ba6-54a5-4985-ac05-2887f056f798"'
    ].join('\n');
    fs.writeFileSync(frontendEnv, defaultFrontendEnv, 'utf8');
    console.log('\x1b[32m[StockPulse]\x1b[0m Created default frontend/.env');
  }
}

// 2. Helper to check if a TCP port is open
function checkPortOpen(port, host = '127.0.0.1', timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// 3. Helper to kill any process currently occupying a port on Windows
function freePort(port) {
  if (process.platform !== 'win32') return;
  try {
    const stdout = execSync(`netstat -ano -p tcp`, { encoding: 'utf8' });
    const lines = stdout.split('\r\n');
    const pidsToKill = new Set();
    for (const line of lines) {
      if (line.includes(`:${port} `) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          pidsToKill.add(pid);
        }
      }
    }
    for (const pid of pidsToKill) {
      console.log(`\x1b[33m[StockPulse]\x1b[0m Port ${port} was locked by PID ${pid}. Cleared port.`);
      try {
        execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
      } catch {
        // Ignore if already exited
      }
    }
  } catch {
    // Non-fatal if netstat/taskkill fails
  }
}

// 4. Ensure Prisma client is generated
function ensurePrismaClient() {
  const prismaClientPath = path.join(serverDir, 'node_modules', '.prisma', 'client');
  if (!fs.existsSync(prismaClientPath)) {
    console.log('\x1b[33m[StockPulse]\x1b[0m Generating Prisma Client...');
    try {
      execSync(`node -e "require('prisma/build/index.js')" generate`, {
        cwd: serverDir,
        stdio: 'inherit'
      });
      console.log('\x1b[32m[StockPulse]\x1b[0m Prisma Client successfully generated.');
    } catch (e) {
      console.warn('\x1b[33m[StockPulse Warning]\x1b[0m Could not generate Prisma Client:', e.message);
    }
  }
}

// 5. Ensure Postgres is reachable
async function ensureDatabase() {
  const isPostgresRunning = await checkPortOpen(5432);
  if (!isPostgresRunning) {
    console.log('\x1b[33m[StockPulse]\x1b[0m PostgreSQL (port 5432) is offline. Attempting to start via Docker Compose...');
    try {
      execSync('docker compose up -d postgres', { cwd: rootDir, stdio: 'inherit' });
      // Wait up to 10 seconds for it to accept connections
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (await checkPortOpen(5432)) {
          console.log('\x1b[32m[StockPulse]\x1b[0m PostgreSQL container is healthy and ready on port 5432.');
          return;
        }
      }
    } catch {
      console.warn('\x1b[33m[StockPulse Warning]\x1b[0m Could not auto-start Docker container.');
      console.warn('\x1b[33m[StockPulse Tip]\x1b[0m Make sure Docker Desktop is running or start your local PostgreSQL service.');
    }
  } else {
    console.log('\x1b[32m[StockPulse]\x1b[0m PostgreSQL is active on port 5432.');
  }
}

async function main() {
  console.log('\x1b[36m===============================================================\x1b[0m');
  console.log('\x1b[36m⚡ StockPulse Engine: Self-Healing Development Runner\x1b[0m');
  console.log('\x1b[36m===============================================================\x1b[0m');

  // Pre-flight automated self-healing checks
  ensureEnvFiles();
  freePort(3000);
  freePort(3001);
  await ensureDatabase();
  ensurePrismaClient();

  const nodeBin = process.execPath;
  const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');

  // Launch Backend API Server
  console.log('\x1b[34m[server]\x1b[0m Starting API Server on http://localhost:3001...');
  const serverProcess = spawn(
    nodeBin,
    ['--import', 'tsx', '--watch', 'src/server.ts'],
    {
      cwd: serverDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    }
  );

  // Launch Frontend App
  console.log('\x1b[32m[frontend]\x1b[0m Starting Next.js Web App on http://localhost:3000...');
  const frontendProcess = spawn(
    nodeBin,
    [nextBin, 'dev'],
    {
      cwd: frontendDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    }
  );

  serverProcess.on('error', (err) => {
    console.error('\x1b[31m[server error]\x1b[0m', err.message);
  });

  frontendProcess.on('error', (err) => {
    console.error('\x1b[31m[frontend error]\x1b[0m', err.message);
  });

  // Graceful cleanup on Ctrl+C or shutdown
  let isShuttingDown = false;
  function cleanup() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n\x1b[33m[StockPulse] Gracefully shutting down all services...\x1b[0m');

    if (process.platform === 'win32') {
      if (serverProcess && serverProcess.pid) {
        try { execSync(`taskkill /F /T /PID ${serverProcess.pid}`, { stdio: 'ignore' }); } catch {}
      }
      if (frontendProcess && frontendProcess.pid) {
        try { execSync(`taskkill /F /T /PID ${frontendProcess.pid}`, { stdio: 'ignore' }); } catch {}
      }
    } else {
      if (serverProcess) serverProcess.kill('SIGINT');
      if (frontendProcess) frontendProcess.kill('SIGINT');
    }
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('\x1b[31m[StockPulse Fatal]\x1b[0m', err);
});
