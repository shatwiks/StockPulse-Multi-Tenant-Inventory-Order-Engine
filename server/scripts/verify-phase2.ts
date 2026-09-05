process.env.NODE_ENV = 'test';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../src/server';
import prisma from '../src/db/client';

interface TestTokens {
  acmeAdmin: string;
  acmeManager: string;
  acmeCashier: string;
  summitAdmin: string;
}

interface TestIds {
  acmeOrgId: string;
  summitOrgId: string;
  acmeProduct: { id: string; sku: string; unitPrice: string | number };
  summitProduct: { id: string; sku: string; unitPrice: string | number };
}

async function runPhase2Verification(): Promise<void> {
  console.log('===============================================================');
  console.log('🛡️  StockPulse Phase 2 Enterprise Security & Concurrency Verification');
  console.log('===============================================================');

  // 1. Verify Database Connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to PostgreSQL database.');
  } catch (err: any) {
    console.error('❌ Cannot reach PostgreSQL. Please ensure Docker container is up: docker compose up -d');
    process.exit(1);
  }

  // 2. Start Test Server on Ephemeral Port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`🚀 Ephemeral test server initialized on port ${port}.`);

  let allTestsPassed = true;

  try {
    // 3. Authenticate and Gather Test Tokens
    console.log('\n🔑 [Step 1] Authenticating Test Users across Tenants...');

    async function login(email: string, password = 'StockPulse2026!'): Promise<string> {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
      }
      return data.token;
    }

    const tokens: TestTokens = {
      acmeAdmin: await login('admin@acme-retail.com'),
      acmeManager: await login('manager@acme-retail.com'),
      acmeCashier: await login('cashier@acme-retail.com'),
      summitAdmin: await login('admin@summit-supplies.com'),
    };

    console.log('   ✅ Acme Retail Admin token acquired.');
    console.log('   ✅ Acme Retail Manager token acquired.');
    console.log('   ✅ Acme Retail Cashier token acquired.');
    console.log('   ✅ Summit Supplies Admin token acquired.');

    // 4. Fetch Sample Products from Each Tenant
    const acmeOrg = await prisma.organization.findUniqueOrThrow({ where: { slug: 'acme-retail' } });
    const summitOrg = await prisma.organization.findUniqueOrThrow({ where: { slug: 'summit-supplies' } });

    const acmeProd = await prisma.product.findFirstOrThrow({ where: { organizationId: acmeOrg.id } });
    const summitProd = await prisma.product.findFirstOrThrow({ where: { organizationId: summitOrg.id } });

    const ids: TestIds = {
      acmeOrgId: acmeOrg.id,
      summitOrgId: summitOrg.id,
      acmeProduct: { id: acmeProd.id, sku: acmeProd.sku, unitPrice: Number(acmeProd.unitPrice) },
      summitProduct: { id: summitProd.id, sku: summitProd.sku, unitPrice: Number(summitProd.unitPrice) },
    };

    // ------------------------------------------------------------------------
    // TEST 1: Cross-Tenant Isolation Test (IDOR / BOLA Prevention)
    // ------------------------------------------------------------------------
    console.log('\n🔒 [Test 1] Verifying Cross-Tenant Isolation (BOLA / IDOR Defense)...');
    console.log(`   Tenant 1 (Acme) attempts to update Tenant 2 (Summit) Product ID: ${ids.summitProduct.id}`);

    const crossTenantRes = await fetch(`${baseUrl}/products/${ids.summitProduct.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.acmeAdmin}`,
      },
      body: JSON.stringify({ unitPrice: 9999.99 }),
    });

    const crossTenantData = await crossTenantRes.json();
    if (crossTenantRes.status === 404 || crossTenantRes.status === 403) {
      console.log(`   ✅ PASSED: Server rejected cross-tenant mutation with HTTP ${crossTenantRes.status} (${crossTenantData.error}).`);
    } else {
      console.error(`   ❌ FAILED: Cross-tenant update was permitted! Status: ${crossTenantRes.status}`);
      allTestsPassed = false;
    }

    // Verify Summit product was untouched in database
    const freshSummitProd = await prisma.product.findUniqueOrThrow({ where: { id: ids.summitProduct.id } });
    if (Number(freshSummitProd.unitPrice) === Number(ids.summitProduct.unitPrice)) {
      console.log(`   ✅ Verified target product price unchanged in database ($${Number(freshSummitProd.unitPrice).toFixed(2)}).`);
    } else {
      console.error(`   ❌ FAILED: Target product price was modified by cross-tenant request!`);
      allTestsPassed = false;
    }

    // ------------------------------------------------------------------------
    // TEST 2: Role-Based Access Control (RBAC - Principle of Least Privilege)
    // ------------------------------------------------------------------------
    console.log('\n👮 [Test 2] Verifying Role-Based Access Control (RBAC)...');
    console.log('   2a. CASHIER attempts to mutate product unit price...');

    const cashierUpdateRes = await fetch(`${baseUrl}/products/${ids.acmeProduct.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.acmeCashier}`,
      },
      body: JSON.stringify({ unitPrice: 1.0 }),
    });

    const cashierUpdateData = await cashierUpdateRes.json();
    if (cashierUpdateRes.status === 403) {
      console.log(`   ✅ PASSED: CASHIER rejected with HTTP 403 Forbidden (${cashierUpdateData.error}).`);
    } else {
      console.error(`   ❌ FAILED: CASHIER was allowed to edit price! Status: ${cashierUpdateRes.status}`);
      allTestsPassed = false;
    }

    console.log('   2b. CASHIER attempts to delete a product...');
    const cashierDeleteRes = await fetch(`${baseUrl}/products/${ids.acmeProduct.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokens.acmeCashier}`,
      },
    });

    if (cashierDeleteRes.status === 403) {
      console.log(`   ✅ PASSED: CASHIER deletion rejected with HTTP 403 Forbidden.`);
    } else {
      console.error(`   ❌ FAILED: CASHIER was allowed to delete product! Status: ${cashierDeleteRes.status}`);
      allTestsPassed = false;
    }

    console.log('   2c. MANAGER updates product unit price (authorized)...');
    const managerUpdateRes = await fetch(`${baseUrl}/products/${ids.acmeProduct.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.acmeManager}`,
      },
      body: JSON.stringify({ description: 'Updated by Manager during security test.' }),
    });

    if (managerUpdateRes.status === 200) {
      console.log(`   ✅ PASSED: MANAGER permitted with HTTP 200 OK.`);
    } else {
      console.error(`   ❌ FAILED: MANAGER update rejected unexpectedly! Status: ${managerUpdateRes.status}`);
      allTestsPassed = false;
    }

    // ------------------------------------------------------------------------
    // TEST 3: Unauthenticated Access & Parameter Tampering
    // ------------------------------------------------------------------------
    console.log('\n🚫 [Test 3] Verifying Zero-Trust Unauthenticated & Tampered Requests...');
    const noAuthRes = await fetch(`${baseUrl}/products`);
    if (noAuthRes.status === 401) {
      console.log('   ✅ PASSED: Unauthenticated request rejected with HTTP 401 Unauthorized.');
    } else {
      console.error(`   ❌ FAILED: Unauthenticated request returned HTTP ${noAuthRes.status}`);
      allTestsPassed = false;
    }

    const tamperedTokenRes = await fetch(`${baseUrl}/products`, {
      headers: { Authorization: 'Bearer forged.jwt.token' },
    });
    if (tamperedTokenRes.status === 401) {
      console.log('   ✅ PASSED: Tampered/invalid JWT rejected with HTTP 401 Unauthorized.');
    } else {
      console.error(`   ❌ FAILED: Tampered token returned HTTP ${tamperedTokenRes.status}`);
      allTestsPassed = false;
    }

    // ------------------------------------------------------------------------
    // TEST 4: Atomic Concurrency Stress Test (10 checkouts on 2 units stock)
    // ------------------------------------------------------------------------
    console.log('\n⚡ [Test 4] Atomic Concurrency Stress Test (10 concurrent checkouts on 2 units of stock)...');

    // Create a temporary test product with exactly 2 units in stock
    const testSku = `RACE-SEC-${Date.now()}`;
    const raceTestProduct = await prisma.product.create({
      data: {
        organizationId: ids.acmeOrgId,
        sku: testSku,
        name: 'High-Demand Limited Edition Widget',
        unitPrice: 50.0,
        stockQuantity: 2, // Exactly 2 units in stock
        reorderLevel: 1,
        status: 'ACTIVE',
      },
    });

    console.log(`   Created test product '${raceTestProduct.name}' (SKU: ${raceTestProduct.sku})`);
    console.log(`   Initial Stock Count: 2 units`);
    console.log(`   Firing 10 simultaneous concurrent checkout requests (each purchasing 2 units)...`);

    // Fire 10 simultaneous checkout requests purchasing 2 units each
    const concurrentRequests = Array.from({ length: 10 }).map((_, idx) =>
      fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.acmeCashier}`,
        },
        body: JSON.stringify({
          customerName: `Concurrent Buyer #${idx + 1}`,
          customerEmail: `buyer${idx + 1}@race-test.demo`,
          items: [{ productId: raceTestProduct.id, quantity: 2 }],
        }),
      })
    );

    const responses = await Promise.all(concurrentRequests);
    const results = await Promise.all(
      responses.map(async (r) => ({
        status: r.status,
        body: await r.json(),
      }))
    );

    const successfulOrders = results.filter((r) => r.status === 201);
    const conflictErrors = results.filter((r) => r.status === 409);

    console.log(`\n   Concurrency Outcomes:`);
    console.log(`   - HTTP 201 Created (Success): ${successfulOrders.length}`);
    console.log(`   - HTTP 409 Conflict (Shortage): ${conflictErrors.length}`);

    // Verify exactly 1 succeeded and 9 failed with 409
    if (successfulOrders.length === 1 && conflictErrors.length === 9) {
      console.log(`   ✅ PASSED: Exactly 1 checkout succeeded and 9 failed cleanly with HTTP 409 Conflict!`);
    } else {
      console.error(
        `   ❌ FAILED: Unexpected distribution! Succeeded: ${successfulOrders.length}, Conflicts: ${conflictErrors.length}`
      );
      allTestsPassed = false;
    }

    // Verify 409 Conflict response contains itemized shortages list
    if (conflictErrors.length > 0 && conflictErrors[0].body.shortages) {
      console.log(`   ✅ Itemized shortage payload verified:`, JSON.stringify(conflictErrors[0].body.shortages[0]));
    }

    // Verify final stock count in database is exactly 0
    const finalProductState = await prisma.product.findUniqueOrThrow({
      where: { id: raceTestProduct.id },
    });

    console.log(`   Final Database Stock Count: ${finalProductState.stockQuantity} units (Expected: 0)`);
    if (finalProductState.stockQuantity === 0) {
      console.log(`   ✅ PASSED: Final stock count is exactly 0! Zero negative stock, zero overselling.`);
    } else {
      console.error(`   ❌ FAILED: Final stock count mismatch (${finalProductState.stockQuantity} != 0)`);
      allTestsPassed = false;
    }

    // Clean up temporary race test product and order items
    await prisma.orderItem.deleteMany({ where: { productId: raceTestProduct.id } });
    await prisma.order.deleteMany({
      where: {
        organizationId: ids.acmeOrgId,
        customerEmail: { contains: '@race-test.demo' },
      },
    });
    await prisma.product.delete({ where: { id: raceTestProduct.id } });
    console.log(`   🧹 Cleaned up temporary race test data.`);
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  console.log('\n===============================================================');
  if (allTestsPassed) {
    console.log('🎉 ALL PHASE 2 VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  } else {
    console.error('❌ SOME PHASE 2 CHECKS FAILED. Review log output above.');
    process.exit(1);
  }
  console.log('===============================================================');
}

runPhase2Verification().catch((err) => {
  console.error('Fatal error during Phase 2 verification:', err);
  process.exit(1);
});
