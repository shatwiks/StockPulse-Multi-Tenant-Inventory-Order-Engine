process.env.NODE_ENV = 'test';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../src/server';
import prisma from '../src/db/client';

async function runConcurrencyDemoVerification(): Promise<void> {
  console.log('===============================================================');
  console.log('⚡ StockPulse Concurrency Stress-Test API Verification');
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

    // 3. Test 1: Fetch/Provision Demo Flash Sale Product
    console.log('\n📦 [Test 1] Fetching or provisioning demo flash sale product...');
    const demoProdRes = await fetch(`${baseUrl}/concurrency/demo-product`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const demoProdData = await demoProdRes.json();
    if (demoProdRes.status === 200 && demoProdData.success && demoProdData.data.sku === 'FLASH-SALE-DEMO') {
      console.log(`✅ Demo product ready: ID = ${demoProdData.data.id}, SKU = ${demoProdData.data.sku}, Stock = ${demoProdData.data.stockQuantity}`);
    } else {
      console.error('❌ Failed to retrieve demo product:', demoProdData);
      allTestsPassed = false;
    }

    const productId = demoProdData.data.id;

    // 4. Test 2: Reset Demo Stock to 5 Units
    console.log('\n🔄 [Test 2] Resetting demo stock to 5 units in PostgreSQL...');
    const resetRes = await fetch(`${baseUrl}/concurrency/reset-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stockQuantity: 5 }),
    });
    const resetData = await resetRes.json();
    if (resetRes.status === 200 && resetData.success && resetData.data.stockQuantity === 5) {
      console.log('✅ Demo stock atomically set to 5 units.');
    } else {
      console.error('❌ Failed to reset demo stock:', resetData);
      allTestsPassed = false;
    }

    // 5. Test 3: Dispatch 15 Simultaneous Parallel Checkouts
    console.log('\n⚡ [Test 3] Dispatching 15 parallel checkout requests against 5 available units...');
    const checkoutPromises = Array.from({ length: 15 }, async (_, i) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName: `Parallel Terminal #${i + 1}`,
          customerEmail: `terminal${i + 1}@stress-test.internal`,
          items: [{ productId, quantity: 1 }],
        }),
      });
      return { status: res.status, data: await res.json() };
    });

    const outcomes = await Promise.all(checkoutPromises);
    const succeeded = outcomes.filter((o) => o.status === 201).length;
    const conflicts = outcomes.filter((o) => o.status === 409).length;

    console.log(`   Execution Results: ${succeeded} checkouts succeeded (201), ${conflicts} blocked (409).`);

    if (succeeded === 5 && conflicts === 10) {
      console.log('✅ PERFECT LOCKING: Exactly 5 checkouts won and 10 were cleanly rejected with HTTP 409 Conflict!');
    } else {
      console.error(`❌ Locking mismatch! Expected 5 successes and 10 conflicts, got: ${succeeded} / ${conflicts}`);
      allTestsPassed = false;
    }

    // 6. Test 4: Verify Final Stock in PostgreSQL
    const finalProduct = await prisma.product.findUnique({ where: { id: productId } });
    console.log(`   Final Database Stock Count: ${finalProduct?.stockQuantity} units (Expected: 0)`);

    if (finalProduct?.stockQuantity === 0) {
      console.log('✅ ZERO NEGATIVE DRIFT: Final database stock is exactly 0!');
    } else {
      console.error(`❌ Negative drift detected! Final stock: ${finalProduct?.stockQuantity}`);
      allTestsPassed = false;
    }

    // Clean up created orders & reset stock
    console.log('\n🧹 Cleaning up test orders and restoring stock...');
    await prisma.orderItem.deleteMany({ where: { productId } });
    await prisma.order.deleteMany({ where: { customerEmail: { contains: '@stress-test.internal' } } });
    await prisma.product.update({ where: { id: productId }, data: { stockQuantity: 5, status: 'ACTIVE' } });
    console.log('✅ Test orders cleaned and stock reset to 5.');
  } catch (err) {
    console.error('❌ Unexpected test error:', err);
    allTestsPassed = false;
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  if (!allTestsPassed) {
    console.error('\n❌ Concurrency demo verification failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CONCURRENCY STRESS-TEST VERIFICATION CHECKS PASSED!\n');
    process.exit(0);
  }
}

runConcurrencyDemoVerification();
