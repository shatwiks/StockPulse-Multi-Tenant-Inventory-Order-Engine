import { PrismaClient, OrganizationStatus, UserRole, ProductStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'StockPulse2026!';
const BCRYPT_SALT_ROUNDS = 10;
const defaultPasswordHash = bcrypt.hashSync(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS);

async function cleanExistingData() {
  console.log('🧹 Cleaning existing test organizations data (if any)...');
  const testSlugs = ['acme-retail', 'summit-supplies', 'aeroshield-dynamics', 'biovanguard-diagnostics'];

  const existingOrgs = await prisma.organization.findMany({
    where: { slug: { in: testSlugs } },
    select: { id: true },
  });

  if (existingOrgs.length > 0) {
    const orgIds = existingOrgs.map((o) => o.id);
    await prisma.organization.deleteMany({
      where: { id: { in: orgIds } },
    });
    console.log(`   Deleted ${existingOrgs.length} existing test organization(s).`);
  }
}

async function seedAcmeRetail() {
  console.log('\n🏬 [Tenant 1] Seeding Acme Retail...');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const org = await tx.organization.create({
      data: {
        name: 'Acme Retail',
        slug: 'acme-retail',
        currency: 'USD',
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 2. Create Users (ADMIN, MANAGER, CASHIER)
    const users = await Promise.all([
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'admin@acme-retail.com',
          firstName: 'Alice',
          lastName: 'Morgan',
          passwordHash: defaultPasswordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'manager@acme-retail.com',
          firstName: 'Bob',
          lastName: 'Miller',
          passwordHash: defaultPasswordHash,
          role: UserRole.MANAGER,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'cashier@acme-retail.com',
          firstName: 'Charlie',
          lastName: 'Davis',
          passwordHash: defaultPasswordHash,
          role: UserRole.CASHIER,
          isActive: true,
        },
      }),
    ]);

    // 3. Create Categories
    const catElectronics = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Consumer Electronics',
        slug: 'acme-electronics',
        description: 'Audio, accessories, and portable electronics',
      },
    });

    const catApparel = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Apparel & Uniforms',
        slug: 'acme-apparel',
        description: 'Retail and staff apparel',
      },
    });

    const catPantry = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Pantry & Beverages',
        slug: 'acme-pantry',
        description: 'Packaged beverages, coffee, and pantry essentials',
      },
    });

    // 4. Create Products with Varied Stock Levels
    const products = await Promise.all([
      // In Stock Items (stock > reorderLevel)
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catElectronics.id,
          sku: 'ACM-ELC-1001',
          name: 'Wireless Noise-Cancelling Headphones',
          description: 'High-fidelity Bluetooth 5.3 headphones with active noise cancellation',
          unitPrice: 149.99,
          costPrice: 85.0,
          stockQuantity: 45, // IN STOCK
          reorderLevel: 10,
          status: ProductStatus.ACTIVE,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catElectronics.id,
          sku: 'ACM-ELC-1002',
          name: 'USB-C Fast Charging Hub (65W)',
          description: 'Multi-port gallium nitride (GaN) fast wall charger with dual Type-C',
          unitPrice: 39.95,
          costPrice: 18.5,
          stockQuantity: 80, // IN STOCK
          reorderLevel: 15,
          status: ProductStatus.ACTIVE,
        },
      }),
      // Low Stock Items (0 < stock <= reorderLevel)
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catApparel.id,
          sku: 'ACM-APP-2001',
          name: 'Heavy-Duty Canvas Work Apron',
          description: 'Water-resistant reinforced canvas apron with leather tool loops',
          unitPrice: 28.5,
          costPrice: 12.0,
          stockQuantity: 4, // LOW STOCK
          reorderLevel: 10,
          status: ProductStatus.ACTIVE,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catPantry.id,
          sku: 'ACM-PAN-3001',
          name: 'Artisan Dark Roast Espresso Beans (1kg)',
          description: 'Single-origin fair trade whole bean coffee for commercial espresso machines',
          unitPrice: 24.0,
          costPrice: 11.25,
          stockQuantity: 5, // LOW STOCK
          reorderLevel: 12,
          status: ProductStatus.ACTIVE,
        },
      }),
      // Out of Stock Items (stock = 0)
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catElectronics.id,
          sku: 'ACM-ELC-1003',
          name: 'Thermal Receipt Printer (Bluetooth)',
          description: 'High-speed 80mm POS receipt printer with drop-in paper loading',
          unitPrice: 185.0,
          costPrice: 110.0,
          stockQuantity: 0, // OUT OF STOCK
          reorderLevel: 8,
          status: ProductStatus.OUT_OF_STOCK,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catApparel.id,
          sku: 'ACM-APP-2002',
          name: 'High-Visibility Safety Vest (Class 2)',
          description: 'Fluorescent yellow mesh safety vest with 2-inch reflective stripes',
          unitPrice: 16.5,
          costPrice: 6.8,
          stockQuantity: 0, // OUT OF STOCK
          reorderLevel: 20,
          status: ProductStatus.OUT_OF_STOCK,
        },
      }),
    ]);

    // 5. Create Orders (COMPLETED, HELD, CANCELLED)
    const order1 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-ACM-2026-0001',
        customerName: 'Cornerstone Hospitality LLC',
        customerEmail: 'purchasing@cornerstone-hospitality.demo',
        status: OrderStatus.COMPLETED,
        totalAmount: 379.88,
        taxAmount: 30.98,
        notes: 'Delivered to main dining room store counter.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[0].id,
              quantity: 2,
              unitPrice: 149.99,
              totalPrice: 299.98,
            },
            {
              organizationId: org.id,
              productId: products[1].id,
              quantity: 2,
              unitPrice: 39.95,
              totalPrice: 79.9,
            },
          ],
        },
      },
    });

    const order2 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-ACM-2026-0002',
        customerName: 'Metro Cafe & Roastery',
        customerEmail: 'orders@metrocafe.demo',
        status: OrderStatus.HELD,
        totalAmount: 72.0,
        taxAmount: 5.87,
        notes: 'Held at register counter pending customer return from warehouse aisle.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[3].id,
              quantity: 3,
              unitPrice: 24.0,
              totalPrice: 72.0,
            },
          ],
        },
      },
    });

    const order3 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-ACM-2026-0003',
        customerName: 'Highland Hotel & Suites',
        customerEmail: 'ops@highlandsuites.demo',
        status: OrderStatus.CANCELLED,
        totalAmount: 185.0,
        taxAmount: 15.08,
        notes: 'Order cancelled due to thermal printer supplier backorder.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[4].id,
              quantity: 1,
              unitPrice: 185.0,
              totalPrice: 185.0,
            },
          ],
        },
      },
    });

    return {
      org,
      users,
      products,
      orders: [order1, order2, order3],
    };
  });
}

async function seedSummitSupplies() {
  console.log('\n🏔️  [Tenant 2] Seeding Summit Supplies...');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const org = await tx.organization.create({
      data: {
        name: 'Summit Supplies',
        slug: 'summit-supplies',
        currency: 'USD',
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 2. Create Users (ADMIN, MANAGER, CASHIER)
    const users = await Promise.all([
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'admin@summit-supplies.com',
          firstName: 'David',
          lastName: 'Kim',
          passwordHash: defaultPasswordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'manager@summit-supplies.com',
          firstName: 'Emily',
          lastName: 'Watson',
          passwordHash: defaultPasswordHash,
          role: UserRole.MANAGER,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'cashier@summit-supplies.com',
          firstName: 'Frank',
          lastName: 'Castle',
          passwordHash: defaultPasswordHash,
          role: UserRole.CASHIER,
          isActive: true,
        },
      }),
    ]);

    // 3. Create Categories
    const catHardware = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Hardware & Fasteners',
        slug: 'summit-hardware',
        description: 'Industrial fasteners, anchors, and brackets',
      },
    });

    const catSafety = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Safety & PPE',
        slug: 'summit-safety',
        description: 'Industrial helmets, eyewear, and respirators',
      },
    });

    // 4. Create Products with Varied Stock Levels
    const products = await Promise.all([
      // In Stock Items
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catHardware.id,
          sku: 'SMT-HDW-4001',
          name: 'Galvanized Hex Head Bolt Set (Grade 8)',
          description: 'High-tensile Grade 8 galvanized steel bolts with nylon lock nuts (Pack of 100)',
          unitPrice: 42.5,
          costPrice: 21.0,
          stockQuantity: 120, // IN STOCK
          reorderLevel: 25,
          status: ProductStatus.ACTIVE,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catSafety.id,
          sku: 'SMT-SAF-5001',
          name: 'ANSI Z87.1 Anti-Fog Safety Glasses',
          description: 'Scratch-resistant polycarbonate wraparound protective eye shield',
          unitPrice: 12.99,
          costPrice: 4.8,
          stockQuantity: 65, // IN STOCK
          reorderLevel: 15,
          status: ProductStatus.ACTIVE,
        },
      }),
      // Low Stock Items
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catSafety.id,
          sku: 'SMT-SAF-5002',
          name: 'Dual-Cartridge Half-Mask Respirator (N95)',
          description: 'Ergonomic silicone face seal respirator with replaceable particulate filters',
          unitPrice: 48.0,
          costPrice: 26.5,
          stockQuantity: 3, // LOW STOCK
          reorderLevel: 10,
          status: ProductStatus.ACTIVE,
        },
      }),
      // Out of Stock Items
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catHardware.id,
          sku: 'SMT-HDW-4002',
          name: 'Pneumatic Framing Nailer (21 Degree)',
          description: 'Heavy-duty magazine framing nailer for timber construction',
          unitPrice: 229.0,
          costPrice: 145.0,
          stockQuantity: 0, // OUT OF STOCK
          reorderLevel: 5,
          status: ProductStatus.OUT_OF_STOCK,
        },
      }),
    ]);

    // 5. Create Orders (COMPLETED, HELD)
    const order1 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-SMT-2026-0001',
        customerName: 'Apex Construction Partners',
        customerEmail: 'supply@apexconstruct.demo',
        status: OrderStatus.COMPLETED,
        totalAmount: 170.0,
        taxAmount: 13.85,
        notes: 'Job site #4 delivery confirmed.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[0].id,
              quantity: 4,
              unitPrice: 42.5,
              totalPrice: 170.0,
            },
          ],
        },
      },
    });

    const order2 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-SMT-2026-0002',
        customerName: 'Vanguard Industrial Services',
        customerEmail: 'safety@vanguard-ind.demo',
        status: OrderStatus.HELD,
        totalAmount: 96.0,
        taxAmount: 7.82,
        notes: 'Pending purchase order verification from safety department.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[2].id,
              quantity: 2,
              unitPrice: 48.0,
              totalPrice: 96.0,
            },
          ],
        },
      },
    });

    return {
      org,
      users,
      products,
      orders: [order1, order2],
    };
  });
}

async function main() {
  console.log('===============================================================');
  console.log('🌱 StockPulse Multi-Tenant Enterprise Database Seeder');
  console.log('===============================================================');

  await cleanExistingData();
  const acme = await seedAcmeRetail();
  const summit = await seedSummitSupplies();

  console.log('\n===============================================================');
  console.log('✅ Seeding Completed Successfully!');
  console.log('===============================================================');
  console.log(`🏢 Organization 1: ${acme.org.name} (${acme.org.slug})`);
  console.log(`   - Users: ${acme.users.length} (Admin: admin@acme-retail.com, Password: ${DEFAULT_PASSWORD})`);
  console.log(`   - Products: ${acme.products.length} (In Stock, Low Stock, Out of Stock)`);
  console.log(`   - Orders: ${acme.orders.length}`);

  console.log(`\n🏢 Organization 2: ${summit.org.name} (${summit.org.slug})`);
  console.log(`   - Users: ${summit.users.length} (Admin: admin@summit-supplies.com, Password: ${DEFAULT_PASSWORD})`);
  console.log(`   - Products: ${summit.products.length} (In Stock, Low Stock, Out of Stock)`);
  console.log(`   - Orders: ${summit.orders.length}`);
  console.log('===============================================================');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
