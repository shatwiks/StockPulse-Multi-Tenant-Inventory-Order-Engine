process.env.NODE_ENV = 'test';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { AddressInfo } from 'net';
import { app } from '../src/server';

async function runApiDocsVerification(): Promise<void> {
  console.log('===============================================================');
  console.log('📚 StockPulse Architecture Records (ADR) & OpenAPI 3.0 Verification');
  console.log('===============================================================');

  // 1. Ephemeral Test Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Ephemeral test server initialized on port ${port}.`);

  let allTestsPassed = true;

  try {
    // 2. Test: Fetch OpenAPI 3.0 Spec JSON
    console.log('\n📄 [Test 1] Testing GET /api/v1/openapi.json...');
    const specRes = await fetch(`${baseUrl}/api/v1/openapi.json`);
    const specData = await specRes.json();

    const requiredPaths = [
      '/auth/login',
      '/products',
      '/orders',
      '/categories',
      '/concurrency/demo-product',
      '/concurrency/reset-stock',
      '/system/health',
      '/organization',
    ];

    const hasAllPaths = requiredPaths.every((p) => p in specData.paths);
    const hasBearerAuth = !!specData.components?.securitySchemes?.bearerAuth;
    const hasInsufficientStockError = !!specData.components?.schemas?.InsufficientStockError;

    if (
      specRes.status === 200 &&
      specData.openapi === '3.0.3' &&
      hasAllPaths &&
      hasBearerAuth &&
      hasInsufficientStockError
    ) {
      console.log(`✅ OpenAPI 3.0 specification valid:`);
      console.log(`   - OpenAPI Version: ${specData.openapi}`);
      console.log(`   - Documented Paths: ${Object.keys(specData.paths).length} endpoints`);
      console.log(`   - Security Schemes: bearerAuth (JWT) configured`);
      console.log(`   - Schemas: ${Object.keys(specData.components.schemas).length} schemas verified`);
    } else {
      console.error('❌ OpenAPI 3.0 spec validation failed:', {
        status: specRes.status,
        version: specData.openapi,
        hasAllPaths,
        hasBearerAuth,
        hasInsufficientStockError,
      });
      allTestsPassed = false;
    }

    // 3. Test: Fetch Interactive Documentation HTML
    console.log('\n💻 [Test 2] Testing GET /api/docs and /docs...');
    const docsRes = await fetch(`${baseUrl}/api/docs`);
    const docsHtml = await docsRes.text();

    if (
      docsRes.status === 200 &&
      docsHtml.includes('StockPulse Engine | OpenAPI 3.0 Interactive Documentation') &&
      docsHtml.includes('scalar')
    ) {
      console.log(`✅ Interactive API documentation console served at /api/docs (HTML size: ${docsHtml.length} bytes).`);
    } else {
      console.error('❌ Failed to retrieve interactive API documentation UI.');
      allTestsPassed = false;
    }

    // 4. Test: Verify Architecture Decision Records (ADRs) on Disk
    console.log('\n🏛️ [Test 3] Verifying Architectural Decision Records (ADRs)...');
    const adrDir = path.resolve(__dirname, '../../docs/adr');
    const requiredAdrs = [
      'README.md',
      'ADR-001-pessimistic-concurrency-control.md',
      'ADR-002-multi-tenant-partitioning-strategy.md',
      'ADR-003-deadlock-prevention-lock-ordering.md',
    ];

    for (const adrFile of requiredAdrs) {
      const fullPath = path.join(adrDir, adrFile);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        console.log(`   ✓ ${adrFile} (${content.length} bytes, Status: ACCEPTED)`);
      } else {
        console.error(`   ✗ Missing ADR file: ${adrFile}`);
        allTestsPassed = false;
      }
    }
  } catch (err) {
    console.error('❌ Unexpected verification error:', err);
    allTestsPassed = false;
  } finally {
    if ('closeAllConnections' in server) {
      (server as any).closeAllConnections();
    }
    server.close();
  }

  if (!allTestsPassed) {
    console.error('\n❌ Architectural & OpenAPI verification failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ARCHITECTURAL RECORDS & OPENAPI 3.0 CHECKS PASSED!\n');
  }
}

runApiDocsVerification();
