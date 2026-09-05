process.env.NODE_ENV = 'test';
import prisma from '../src/db/client';
import { generateToken } from '../src/middleware/auth';
import { app } from '../src/server';
import http from 'http';

const TEST_PORT = 3099;

async function runPhase3Verification() {
  console.log('\n===============================================================');
  console.log('🧪 STOCKPULSE PHASE 3: FRONTEND API & CHECKOUT VERIFICATION');
  console.log('===============================================================');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api/v1`;

  try {
    // 1. Fetch seed organizations & users
    const acmeOrg = await prisma.organization.findFirstOrThrow({
      where: { slug: { in: ['bharat-retail', 'acme-retail'] } },
    });

    const acmeAdmin = await prisma.user.findFirstOrThrow({
      where: { organizationId: acmeOrg.id, role: 'ADMIN' },
    });

    const acmeCashier = await prisma.user.findFirstOrThrow({
      where: { organizationId: acmeOrg.id, role: 'CASHIER' },
    });

    const adminToken = generateToken({
      userId: acmeAdmin.id,
      organizationId: acmeOrg.id,
      role: acmeAdmin.role,
      email: acmeAdmin.email,
    });

    const cashierToken = generateToken({
      userId: acmeCashier.id,
      organizationId: acmeOrg.id,
      role: acmeCashier.role,
      email: acmeCashier.email,
    });

    // ------------------------------------------------------------------------
    // Check 1: GET /api/v1/products with query filters
    // ------------------------------------------------------------------------
    console.log('\n[1/4] Testing GET /api/v1/products (TanStack Query simulation)...');
    const getRes = await fetch(`${baseUrl}/products?page=1&limit=8&status=IN_STOCK`, {
      headers: { Authorization: `Bearer ${cashierToken}` },
    });
    const getData = await getRes.json();
    if (getRes.status !== 200 || !getData.success || !Array.isArray(getData.data)) {
      throw new Error(`GET /products failed with status ${getRes.status}: ${JSON.stringify(getData)}`);
    }
    console.log(`   ✅ PASSED: Retrieved ${getData.data.length} in-stock products for Acme Retail.`);
    console.log(`   Metadata: Total=${getData.meta.total}, TotalPages=${getData.meta.totalPages}`);

    // ------------------------------------------------------------------------
    // Check 2: Add Product via POST /api/v1/products
    // ------------------------------------------------------------------------
    console.log('\n[2/4] Testing POST /api/v1/products (Add Product Modal wiring)...');
    const category = await prisma.category.findFirstOrThrow({
      where: { organizationId: acmeOrg.id },
    });

    const testSku = `PHASE3-TEST-${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sku: testSku,
        name: 'Phase 3 Verification Widget',
        categoryId: category.id,
        unitPrice: 49.99,
        stockQuantity: 15,
        reorderLevel: 5,
        description: 'Auto-tested by verify-phase3.ts',
      }),
    });
    const createData = await createRes.json();
    if (createRes.status !== 201 || !createData.success) {
      throw new Error(`POST /products failed: ${JSON.stringify(createData)}`);
    }
    const createdProductId = createData.data.id;
    console.log(`   ✅ PASSED: Created product ${testSku} (ID: ${createdProductId})`);

    // ------------------------------------------------------------------------
    // Check 3: Stock Adjustment via PATCH /api/v1/products/:id/stock
    // ------------------------------------------------------------------------
    console.log('\n[3/4] Testing PATCH /api/v1/products/:id/stock (Adjust Stock Dialog)...');
    const adjustRes = await fetch(`${baseUrl}/products/${createdProductId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ adjustmentQuantity: -5 }),
    });
    const adjustData = await adjustRes.json();
    if (adjustRes.status !== 200 || adjustData.data.newStock !== 10) {
      throw new Error(`PATCH /products/:id/stock failed: ${JSON.stringify(adjustData)}`);
    }
    console.log(`   ✅ PASSED: Stock adjusted from 15 to 10 (delta: -5).`);

    // ------------------------------------------------------------------------
    // Check 4: POS Order Checkout & 409 Shortage Reconcile
    // ------------------------------------------------------------------------
    console.log('\n[4/4] Testing POST /api/v1/orders (POS Checkout & 409 Conflict)...');

    // 4a. Successful POS order (buy 6 of the 10 available)
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        customerName: 'Alice Walk-in',
        customerEmail: 'alice@walkin.com',
        items: [{ productId: createdProductId, quantity: 6 }],
      }),
    });
    const orderData = await orderRes.json();
    if (orderRes.status !== 201 || !orderData.success) {
      throw new Error(`POST /orders failed: ${JSON.stringify(orderData)}`);
    }
    console.log(`   ✅ PASSED: Order #${orderData.data.order.orderNumber} completed. Total: $${orderData.data.order.totalAmount}`);

    // Remaining stock in DB should now be 4
    const remainingProduct = await prisma.product.findUniqueOrThrow({
      where: { id: createdProductId },
    });
    console.log(`   Remaining DB Stock: ${remainingProduct.stockQuantity} units (Expected: 4)`);

    // 4b. Concurrent shortage attempt: request 10 units when only 4 remain
    console.log('   Testing 409 Conflict shortage detection...');
    const conflictRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cashierToken}`,
      },
      body: JSON.stringify({
        customerName: 'Shortage Tester',
        items: [{ productId: createdProductId, quantity: 10 }],
      }),
    });
    const conflictData = await conflictRes.json();
    if (conflictRes.status !== 409 || conflictData.error?.code !== 'INSUFFICIENT_STOCK') {
      throw new Error(`Expected 409 INSUFFICIENT_STOCK, received ${conflictRes.status}: ${JSON.stringify(conflictData)}`);
    }
    const shortageItem = conflictData.error.details[0];
    console.log(`   ✅ PASSED: Cleanly rejected with HTTP 409 Conflict!`);
    console.log(`   Shortage Payload: Available=${shortageItem.availableStock}, Requested=${shortageItem.requestedQuantity}`);

    // Clean up test data
    await prisma.orderItem.deleteMany({ where: { productId: createdProductId } });
    await prisma.order.deleteMany({ where: { organizationId: acmeOrg.id, customerEmail: 'alice@walkin.com' } });
    await prisma.product.delete({ where: { id: createdProductId } });
    console.log('   🧹 Test data cleaned up.');

    console.log('\n===============================================================');
    console.log('🎉 ALL PHASE 3 END-TO-END VERIFICATION CHECKS PASSED!');
    console.log('===============================================================');
  } finally {
    server.close();
  }
}

runPhase3Verification()
  .catch((err) => {
    console.error('❌ Phase 3 verification error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
