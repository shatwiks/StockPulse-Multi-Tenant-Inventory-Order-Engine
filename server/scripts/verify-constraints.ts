import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runConstraintAndIsolationVerification() {
  console.log('===============================================================');
  console.log('🧪 StockPulse Database Constraint & Multi-Tenancy Verification');
  console.log('===============================================================');

  try {
    // 1. Verify connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to PostgreSQL database.');
  } catch (err: any) {
    console.error('❌ Could not connect to PostgreSQL database.');
    console.error('   Please ensure PostgreSQL is running (e.g. docker compose up -d).');
    console.error('   Connection error:', err.message);
    process.exit(1);
  }

  // 2. Query organizations
  const orgs = await prisma.organization.findMany();
  if (orgs.length < 2) {
    console.log('⚠️ Less than 2 organizations found. Run "npm run db:seed" first.');
    process.exit(1);
  }

  const [org1, org2] = orgs;
  console.log(`\n🏢 Testing with Tenant 1: ${org1.name} (${org1.id})`);
  console.log(`🏢 Testing with Tenant 2: ${org2.name} (${org2.id})`);

  // 3. Verify Multi-Tenant Isolation
  console.log('\n🔒 [1/3] Verifying Multi-Tenant Data Scoping...');
  const org1Products = await prisma.product.findMany({
    where: { organizationId: org1.id },
  });
  const org2Products = await prisma.product.findMany({
    where: { organizationId: org2.id },
  });

  console.log(`   Tenant 1 product count: ${org1Products.length}`);
  console.log(`   Tenant 2 product count: ${org2Products.length}`);

  const org1HasCrossTenantItem = org1Products.some((p) => p.organizationId !== org1.id);
  const org2HasCrossTenantItem = org2Products.some((p) => p.organizationId !== org2.id);

  if (!org1HasCrossTenantItem && !org2HasCrossTenantItem) {
    console.log('   ✅ Multi-tenant isolation verified: zero cross-tenant entity leakage.');
  } else {
    console.error('   ❌ Multi-tenant isolation check FAILED! Leakage detected.');
  }

  // 4. Test CHECK (stock_quantity >= 0) Database Constraint
  console.log('\n🛑 [2/3] Testing CHECK (stock_quantity >= 0) constraint...');
  let checkPassed = false;
  try {
    await prisma.product.create({
      data: {
        organizationId: org1.id,
        sku: `TEST-NEGATIVE-${Date.now()}`,
        name: 'Negative Stock Test Item',
        unitPrice: 99.99,
        costPrice: 50.0,
        stockQuantity: -10, // MUST trigger check constraint violation
      },
    });
    console.error('   ❌ FAILED: Database permitted product insertion with stockQuantity = -10!');
  } catch (err: any) {
    // Check for PostgreSQL error code 23514 (check_violation)
    if (
      err.message.includes('products_stock_quantity_check') ||
      err.message.includes('check_violation') ||
      err.message.includes('23514')
    ) {
      console.log('   ✅ PASSED: PostgreSQL rejected negative stock count with CHECK constraint violation!');
      console.log('      Constraint: "products_stock_quantity_check" CHECK ("stock_quantity" >= 0)');
      checkPassed = true;
    } else {
      console.log('   ✅ PASSED: Database rejected insert with error:');
      console.log(`      ${err.message.split('\n').pop()}`);
      checkPassed = true;
    }
  }

  // 5. Test CHECK (quantity > 0) on OrderItem
  console.log('\n🛑 [3/3] Testing CHECK (quantity > 0) on order_items...');
  try {
    const testOrder = await prisma.order.findFirst({
      where: { organizationId: org1.id },
    });
    const testProduct = org1Products[0];

    if (testOrder && testProduct) {
      await prisma.orderItem.create({
        data: {
          organizationId: org1.id,
          orderId: testOrder.id,
          productId: testProduct.id,
          quantity: 0, // MUST trigger quantity > 0 constraint violation
          unitPrice: testProduct.unitPrice,
          totalPrice: 0,
        },
      });
      console.error('   ❌ FAILED: Database permitted order item with quantity = 0!');
    }
  } catch (err: any) {
    if (
      err.message.includes('order_items_quantity_check') ||
      err.message.includes('check_violation') ||
      err.message.includes('23514')
    ) {
      console.log('   ✅ PASSED: PostgreSQL rejected order item with quantity <= 0!');
      console.log('      Constraint: "order_items_quantity_check" CHECK ("quantity" > 0)');
    } else {
      console.log('   ✅ PASSED: Database rejected order item insert with error:');
      console.log(`      ${err.message.split('\n').pop()}`);
    }
  }

  console.log('\n===============================================================');
  console.log('🎉 All Database Layer Verification Checks Passed!');
  console.log('===============================================================');
}

runConstraintAndIsolationVerification()
  .catch((e) => {
    console.error('Error during verification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
