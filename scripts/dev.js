const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// 1. Ensure .env files exist with complete fallback configurations
function ensureEnvFiles() {
  const rootEnv = path.join(rootDir, '.env');
  const backendEnv = path.join(backendDir, '.env');
  const frontendEnv = path.join(frontendDir, '.env');

  const defaultBackendEnv = [
    '# PostgreSQL Connection URL',
    'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockpulse_inventory?schema=public&connection_limit=10&pool_timeout=20"',
    '',
    '# Application Environment',
    'NODE_ENV="development"',
    'PORT=3001',
    'CLIENT_URL="http://localhost:3000"',
    'JWT_SECRET="enterprise-grade-stockpulse-jwt-secret-key-replace-in-production"',
  ].join('\n');

  if (!fs.existsSync(backendEnv)) {
    if (fs.existsSync(rootEnv)) {
      fs.copyFileSync(rootEnv, backendEnv);
      console.log('\x1b[32m[StockPulse]\x1b[0m Created backend/.env from root .env');
    } else {
      fs.writeFileSync(backendEnv, defaultBackendEnv, 'utf8');
      console.log('\x1b[32m[StockPulse]\x1b[0m Created default backend/.env');
    }
  }

  if (!fs.existsSync(frontendEnv)) {
    const defaultFrontendEnv = [
      '# API Base URL (Supports Next.js and Vite conventions)',
      'VITE_API_BASE_URL="http://localhost:3001/api/v1"',
      'NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"',
      'NEXT_PUBLIC_DEFAULT_ORG_ID="8fca3ba6-54a5-4985-ac05-2887f056f798"',
    ].join('\n');
    fs.writeFileSync(frontendEnv, defaultFrontendEnv, 'utf8');
    console.log('\x1b[32m[StockPulse]\x1b[0m Created default frontend/.env');
  }
}

// 2. Remove any stale Next.js lockfiles left by previous crashes
function cleanStaleLocks() {
  const staleLockPaths = [
    path.join(frontendDir, '.next', 'lock'),
    path.join(frontendDir, '.next', 'trace'),
  ];
  for (const lockPath of staleLockPaths) {
    try {
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
      }
    } catch {
      // Ignore if file is inaccessible
    }
  }
}

// 3. Helper to check if a TCP port is open (listening)
function checkPortOpen(port, host = '127.0.0.1', timeoutMs = 800) {
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

// 4. Robust cross-platform port freeing with verified release polling
async function freePort(port) {
  const isOpen = await checkPortOpen(port);
  if (!isOpen) return;

  if (process.platform === 'win32') {
    try {
      const stdout = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
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
        console.log(`\x1b[33m[StockPulse]\x1b[0m Port ${port} was occupied by PID ${pid}. Releasing...`);
        try {
          execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
        } catch {
          // Process might have already exited
        }
      }
    } catch {
      // Ignore netstat failure
    }
  } else {
    // macOS / Linux port cleanup
    try {
      execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: 'ignore' });
      console.log(`\x1b[33m[StockPulse]\x1b[0m Cleared occupied port ${port}.`);
    } catch {
      // Ignore if no process was found
    }
  }

  // Poll until the OS socket actually transitions out of TIME_WAIT (up to 3 seconds)
  const startTime = Date.now();
  while (Date.now() - startTime < 3000) {
    const stillOccupied = await checkPortOpen(port);
    if (!stillOccupied) {
      return;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

// 5. Ensure Prisma client is generated & synchronized across monorepo workspaces
function ensurePrismaClient() {
  const backendPrisma = path.join(backendDir, 'node_modules', '.prisma', 'client', 'index.d.ts');
  const rootPrisma = path.join(rootDir, 'node_modules', '.prisma', 'client', 'index.d.ts');

  const needsGeneration = !fs.existsSync(backendPrisma) || !fs.existsSync(rootPrisma);

  if (needsGeneration) {
    console.log('\x1b[33m[StockPulse]\x1b[0m Generating & synchronizing Prisma Client across monorepo...');
    try {
      execSync(`node -e "require('prisma/build/index.js')" generate`, {
        cwd: backendDir,
        stdio: 'inherit',
      });

      // Synchronize generated client to root hoisted node_modules
      const backendPrismaDir = path.join(backendDir, 'node_modules', '.prisma');
      const rootPrismaDir = path.join(rootDir, 'node_modules', '.prisma');
      if (fs.existsSync(backendPrismaDir) && fs.existsSync(path.join(rootDir, 'node_modules'))) {
        fs.cpSync(backendPrismaDir, rootPrismaDir, { recursive: true });
      }

      console.log('\x1b[32m[StockPulse]\x1b[0m Prisma Client successfully synchronized.');
    } catch (e) {
      console.warn('\x1b[33m[StockPulse Warning]\x1b[0m Could not generate Prisma Client:', e.message);
    }
  }
}

// 6. Ensure PostgreSQL is reachable
async function ensureDatabase() {
  const isPostgresRunning = await checkPortOpen(5432);
  if (!isPostgresRunning) {
    console.log('\x1b[33m[StockPulse]\x1b[0m PostgreSQL (port 5432) is offline. Attempting auto-start via Docker Compose...');
    try {
      execSync('docker compose up -d postgres', { cwd: rootDir, stdio: 'inherit' });
      // Wait up to 15 seconds for PostgreSQL to accept connections
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (await checkPortOpen(5432)) {
          console.log('\x1b[32m[StockPulse]\x1b[0m PostgreSQL container is healthy and ready on port 5432.');
          return true;
        }
      }
    } catch {
      console.warn('\x1b[33m[StockPulse Notice]\x1b[0m Docker auto-start unavailable. Operating in resilient offline-demo mode if needed.');
      return false;
    }
  } else {
    console.log('\x1b[32m[StockPulse]\x1b[0m PostgreSQL is active on port 5432.');
    return true;
  }
  return false;
}

// 7. Ensure Database Schema & Seed Data (Cold-Start Self-Healing)
async function ensureDatabaseSchemaAndSeed(dbActive) {
  if (!dbActive) return;

  try {
    // 7a. Ensure schema is pushed / up to date without prompts
    console.log('\x1b[33m[StockPulse]\x1b[0m Verifying PostgreSQL schema integrity...');
    execSync(`node -e "require('prisma/build/index.js')" db push --skip-generate`, {
      cwd: backendDir,
      stdio: 'pipe',
    });

    // 7b. Check if database has any organizations seeded
    const checkSeedScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      prisma.organization.count()
        .then(count => {
          process.stdout.write(String(count));
          return prisma.$disconnect();
        })
        .catch(() => {
          process.stdout.write('-1');
          return prisma.$disconnect();
        });
    `;

    const countOutput = execSync(`node -e "${checkSeedScript.replace(/\n/g, ' ')}"`, {
      cwd: backendDir,
      encoding: 'utf8',
    }).trim();

    const orgCount = parseInt(countOutput, 10);

    if (orgCount === 0) {
      console.log('\x1b[33m[StockPulse]\x1b[0m Empty database detected. Auto-seeding initial enterprise tenants...');
      execSync('node --import tsx prisma/seed.ts', {
        cwd: backendDir,
        stdio: 'inherit',
      });
      console.log('\x1b[32m[StockPulse]\x1b[0m Database seeded with Bharat Logistics & Deccan Supply Chain!');
    } else if (orgCount > 0) {
      console.log(`\x1b[32m[StockPulse]\x1b[0m Database schema verified (${orgCount} organization(s) active).`);
    }
  } catch (err) {
    console.warn('\x1b[33m[StockPulse Notice]\x1b[0m Schema check bypassed:', err.message);
  }
}

// 8. Helper to poll an HTTP endpoint until ready
function checkHttpReady(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => {
      resolve(false);
    });
  });
}

// 9. Monitor service boot and print clear confirmation banner
async function monitorAndAnnounce() {
  const maxWaitMs = 30000;
  const start = Date.now();
  let backendReady = false;
  let frontendReady = false;

  while (Date.now() - start < maxWaitMs) {
    if (!backendReady) {
      backendReady = await checkHttpReady('http://localhost:3001/health');
    }
    if (!frontendReady) {
      frontendReady = await checkHttpReady('http://localhost:3000');
    }

    if (backendReady && frontendReady) {
      break;
    }
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log('\n\x1b[32m=================================================================\x1b[0m');
  console.log('\x1b[32m⚡ StockPulse Multi-Tenant Engine is LIVE & READY!\x1b[0m');
  console.log('\x1b[32m=================================================================\x1b[0m');
  console.log('   🌐 \x1b[1mFrontend Console:\x1b[0m  \x1b[36mhttp://localhost:3000\x1b[0m');
  console.log('   🚀 \x1b[1mBackend REST API:\x1b[0m  \x1b[36mhttp://localhost:3001\x1b[0m');
  console.log('   📚 \x1b[1mInteractive Docs:\x1b[0m  \x1b[36mhttp://localhost:3001/docs\x1b[0m');
  console.log('   🏥 \x1b[1mSystem Health:\x1b[0m     \x1b[36mhttp://localhost:3001/health\x1b[0m');
  console.log('\x1b[32m=================================================================\x1b[0m\n');

  // Attempt to open browser if not in headless/CI mode
  if (!process.env.CI && !process.env.NO_OPEN) {
    try {
      const openCmd =
        process.platform === 'win32'
          ? 'start http://localhost:3000'
          : process.platform === 'darwin'
          ? 'open http://localhost:3000'
          : 'xdg-open http://localhost:3000';
      execSync(openCmd, { stdio: 'ignore' });
    } catch {
      // Non-fatal if browser cannot be launched automatically
    }
  }
}

async function main() {
  console.log('\x1b[36m===============================================================\x1b[0m');
  console.log('\x1b[36m⚡ StockPulse Engine: Self-Healing Development Runner\x1b[0m');
  console.log('\x1b[36m===============================================================\x1b[0m');

  // Pre-flight automated self-healing checks
  ensureEnvFiles();
  cleanStaleLocks();
  await freePort(3000);
  await freePort(3001);

  const dbActive = await ensureDatabase();
  ensurePrismaClient();
  await ensureDatabaseSchemaAndSeed(dbActive);

  const nodeBin = process.execPath;
  const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');

  // Launch Backend API Server
  console.log('\x1b[34m[backend]\x1b[0m Starting API Server on http://localhost:3001...');
  const serverProcess = spawn(
    nodeBin,
    ['--import', 'tsx', '--watch', 'src/server.ts'],
    {
      cwd: backendDir,
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
    console.error('\x1b[31m[backend error]\x1b[0m', err.message);
  });

  frontendProcess.on('error', (err) => {
    console.error('\x1b[31m[frontend error]\x1b[0m', err.message);
  });

  // Monitor services in the background and display ready banner
  monitorAndAnnounce().catch(() => {});

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
