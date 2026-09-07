process.env.NODE_ENV = 'test';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../src/server';
import prisma from '../src/db/client';

async function runSystemHealthVerification(): Promise<void> {
  console.log('===============================================================');
  console.log('🩺 StockPulse System Telemetry & Observability Verification');
  console.log('===============================================================');

  // 1. Ephemeral Test Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`🚀 Ephemeral test server initialized on port ${port}.`);

  let allTestsPassed = true;

  try {
    // 2. Authenticate as Admin
    console.log('\n🔑 Authenticating as Bharat Retail Admin...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@bharat-retail.in', password: 'StockPulse2026!' }),
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    console.log('✅ Token acquired.');

    // 3. Test: Fetch System Health Telemetry
    console.log('\n📊 [Test 1] Testing GET /api/v1/system/health...');
    const healthRes = await fetch(`${baseUrl}/system/health`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const healthData = await healthRes.json();

    if (
      healthRes.status === 200 &&
      healthData.success &&
      healthData.data.systemStatus === 'OPERATIONAL' &&
      healthData.data.database.connectionPool.maxConnections === 10
    ) {
      console.log(`✅ System health verified: Status = ${healthData.data.systemStatus}, DB Latency = ${healthData.data.database.latencyMs}ms, Pool Capacity = ${healthData.data.database.connectionPool.maxConnections}`);
      console.log(`   API SLA: p50 = ${healthData.data.apiSla.p50LatencyMs}ms, p95 = ${healthData.data.apiSla.p95LatencyMs}ms, p99 = ${healthData.data.apiSla.p99LatencyMs}ms`);
      console.log(`   Live Audit Stream: ${healthData.data.auditStream.length} chronological events retrieved.`);
    } else {
      console.error('❌ Failed to retrieve system health telemetry:', healthData);
      allTestsPassed = false;
    }
  } catch (err) {
    console.error('❌ Unexpected test error:', err);
    allTestsPassed = false;
  } finally {
    if ('closeAllConnections' in server) {
      (server as any).closeAllConnections();
    }
    server.close();
    await prisma.$disconnect();
  }

  if (!allTestsPassed) {
    console.error('\n❌ System health verification failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL SYSTEM HEALTH TELEMETRY CHECKS PASSED!\n');
  }
}

runSystemHealthVerification();
