import prisma from '../src/db/client';
import { placeOrderSchema, InsufficientStockError } from '../src/api/orders.controller';
import { Prisma, OrderStatus } from '@prisma/client';

/**
 * Execute atomic checkout logic directly using the same transactional handler pipeline
 * to test concurrency with true row locking under simultaneous execution.
 */
async function executeOrderPlacement(input: {
  organizationId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ productId: string; quantity: number }>;
}) {
  const { organizationId, customerName, customerEmail, items } = input;

  const quantityByProduct = new Map<string, number>();
  for (const item of items) {
    const current = quantityByProduct.get(item.productId) ?? 0;
    quantityByProduct.set(item.productId, current + item.quantity);
  }

  // Deadlock-free sorted product IDs
  const sortedProductIds = Array.from(quantityByProduct.keys()).sort();

  return await prisma.$transaction(
    async (tx) => {
      // 1. SELECT ... FOR UPDATE (Row-Level Locking)
      const lockedProducts = await tx.$queryRaw<
        Array<{
          id: string;
          name: string;
          sku: string;
          unit_price: string | number;
          stock_quantity: number;
          status: string;
        }>
      >`
        SELECT id, name, sku, unit_price, stock_quantity, status
        FROM products
        WHERE id = ANY(${sortedProductIds}::uuid[]) 
          AND organization_id = ${organizationId}::uuid
        ORDER BY id ASC
        FOR UPDATE;
      `;

      const lockedMap = new Map(lockedProducts.map((p) => [p.id, p]));

      // 2. Stock Sufficiency Check
      for (const [productId, reqQty] of quantityByProduct.entries()) {
        const product = lockedMap.get(productId);
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }

        if (product.stock_quantity < reqQty) {
          throw new InsufficientStockError({
            productId: product.id,
            sku: product.sku,
            name: product.name,
            availableStock: product.stock_quantity,
            requestedQuantity: reqQty,
          });
        }
      }

      // 3. Deduct stock
      for (const [productId, reqQty] of quantityByProduct.entries()) {
        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: { decrement: reqQty } },
        });
      }

      // 4. Create Order & Items
      const orderNumber = `CONCUR-ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      let calculatedTotal = new Prisma.Decimal(0);

      const itemsData = items.map((item) => {
        const prod = lockedMap.get(item.productId)!;
        const price = new Prisma.Decimal(prod.unit_price);
        const total = price.mul(item.quantity);
        calculatedTotal = calculatedTotal.add(total);
        return {
          organizationId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: price,
          totalPrice: total,
        };
      });

      const order = await tx.order.create({
        data: {
          organizationId,
          orderNumber,
          customerName,
          customerEmail,
          status: OrderStatus.CONFIRMED,
          totalAmount: calculatedTotal,
          items: {
            create: itemsData,
          },
        },
      });

      return order;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
}

async function runConcurrencyTest() {
  console.log('===============================================================');
  console.log('⚡ Concurrency Race-Condition & Row-Locking Test');
  console.log('===============================================================');

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    console.error('❌ Database not reachable. Please start PostgreSQL (docker compose up -d).');
    process.exit(1);
  }

  // 1. Setup a test product with exactly 10 units in stock
  let org = await prisma.organization.findFirst({
    where: { slug: 'aeroshield-dynamics' },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'AeroShield Test Org',
        slug: 'aeroshield-dynamics',
        currency: 'USD',
      },
    });
  }

  const testSku = `RACE-TEST-${Date.now()}`;
  const initialStock = 10;

  const testProduct = await prisma.product.create({
    data: {
      organizationId: org.id,
      sku: testSku,
      name: 'High-Precision Laser Transponder (Race Test Item)',
      unitPrice: 500.0,
      costPrice: 250.0,
      stockQuantity: initialStock,
      reorderPoint: 5,
    },
  });

  console.log(`\n📦 Created test product '${testProduct.name}'`);
  console.log(`   SKU: ${testProduct.sku}`);
  console.log(`   Initial Stock Count: ${initialStock} units`);

  // 2. Launch 2 simultaneous checkout requests requesting 7 units EACH
  // Total demand = 14 units, exceeding initial stock of 10!
  console.log('\n🚀 Dispatching 2 concurrent checkouts requesting 7 units each (Total: 14 units)...');
  console.log('   Expected outcome: Exactly ONE order succeeds (201), and ONE order fails with 409 Conflict.');

  const results = await Promise.allSettled([
    executeOrderPlacement({
      organizationId: org.id,
      customerName: 'Buyer A (Concurrent Client 1)',
      customerEmail: 'buyer.a@client1.demo',
      items: [{ productId: testProduct.id, quantity: 7 }],
    }),
    executeOrderPlacement({
      organizationId: org.id,
      customerName: 'Buyer B (Concurrent Client 2)',
      customerEmail: 'buyer.b@client2.demo',
      items: [{ productId: testProduct.id, quantity: 7 }],
    }),
  ]);

  console.log('\n📊 Concurrency Results:');
  let successCount = 0;
  let conflictCount = 0;

  results.forEach((res, index) => {
    const client = index === 0 ? 'Buyer A' : 'Buyer B';
    if (res.status === 'fulfilled') {
      successCount++;
      console.log(`   ✅ ${client}: SUCCESS! Order created -> ${res.value.orderNumber}`);
    } else {
      conflictCount++;
      const err = res.reason;
      if (err instanceof InsufficientStockError || err.name === 'InsufficientStockError') {
        console.log(`   🛑 ${client}: REJECTED WITH 409 CONFLICT!`);
        console.log(`      Error: ${err.code}`);
        console.log(`      Message: ${err.message}`);
        console.log(`      Offending Details:`, err.details);
      } else {
        console.log(`   ❌ ${client}: Failed with error:`, err.message);
      }
    }
  });

  // 3. Verify final stock balance in database
  const finalProduct = await prisma.product.findUnique({
    where: { id: testProduct.id },
  });

  console.log(`\n🔍 Final Database State:`);
  console.log(`   Product: ${finalProduct?.name}`);
  console.log(`   Final Stock: ${finalProduct?.stockQuantity} units (Expected: ${initialStock - 7} = 3 units)`);

  if (successCount === 1 && conflictCount === 1 && finalProduct?.stockQuantity === 3) {
    console.log('\n🎉 PASS: Row-level locking prevented race condition, overselling, and negative stock!');
    console.log('   The second transaction cleanly rolled back with 409 Conflict without data corruption.');
  } else {
    console.error('\n❌ FAIL: Concurrency violation detected!');
  }

  // Cleanup test order items, orders, and product
  await prisma.orderItem.deleteMany({ where: { productId: testProduct.id } });
  await prisma.order.deleteMany({ where: { organizationId: org.id, orderNumber: { startsWith: 'CONCUR-ORD-' } } });
  await prisma.product.delete({ where: { id: testProduct.id } });
  console.log('\n🧹 Cleaned up temporary race test product and orders.');
}

runConcurrencyTest()
  .catch((e) => {
    console.error('Error during concurrency test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
