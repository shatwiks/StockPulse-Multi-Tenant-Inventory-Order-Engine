import { PrismaClient, OrganizationStatus, UserRole, ProductStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'StockPulse2026!';
const BCRYPT_SALT_ROUNDS = 10;
const defaultPasswordHash = bcrypt.hashSync(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS);

async function cleanExistingData() {
  console.log('🧹 Cleaning existing test organizations data (if any)...');
  const testSlugs = [
    'bharat-retail',
    'deccan-supplies',
    'acme-retail',
    'summit-supplies',
    'aeroshield-dynamics',
    'biovanguard-diagnostics',
  ];

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

async function seedBharatRetail() {
  console.log('\n🏬 [Tenant 1] Seeding Bharat Logistics & Retail...');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const org = await tx.organization.create({
      data: {
        name: 'Bharat Logistics & Retail',
        slug: 'bharat-retail',
        currency: 'INR',
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 2. Create Users (ADMIN, MANAGER, CASHIER)
    const users = await Promise.all([
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'admin@bharat-retail.in',
          firstName: 'Aarav',
          lastName: 'Sharma',
          passwordHash: defaultPasswordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'manager@bharat-retail.in',
          firstName: 'Priya',
          lastName: 'Patel',
          passwordHash: defaultPasswordHash,
          role: UserRole.MANAGER,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'cashier@bharat-retail.in',
          firstName: 'Rohan',
          lastName: 'Verma',
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
        name: 'Enterprise Electronics & POS',
        slug: 'bharat-electronics',
        description: 'Commercial barcode readers, thermal POS printers, and charging hubs',
      },
    });

    const catLogistics = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Warehouse & Logistics Gear',
        slug: 'bharat-logistics',
        description: 'Safety footwear, ergonomic aprons, and reflective jackets',
      },
    });

    const catPantry = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Corporate Pantry & Essentials',
        slug: 'bharat-pantry',
        description: 'Premium plantation coffee, tea blends, and refreshment packs',
      },
    });

    // 4. Create Products with Varied Stock Levels & INR Pricing
    const products = await Promise.all([
      // In Stock Items (stock > reorderLevel)
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catLogistics.id,
          sku: 'BHT-SAF-1001',
          name: 'Heavy-Duty Industrial Safety Boots',
          description: 'Steel-toe puncture-resistant ISI certified industrial work boots with oil-resistant sole',
          unitPrice: 2499.00,
          costPrice: 1450.00,
          stockQuantity: 45, // IN STOCK
          reorderLevel: 10,
          status: ProductStatus.ACTIVE,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catElectronics.id,
          sku: 'BHT-ELC-1002',
          name: 'Fast-Charging Power Hub (65W)',
          description: 'Multi-port GaN fast charging desktop hub with dual Type-C PD and surge protection',
          unitPrice: 3999.00,
          costPrice: 2100.00,
          stockQuantity: 80, // IN STOCK
          reorderLevel: 15,
          status: ProductStatus.ACTIVE,
        },
      }),
      // Low Stock Items (0 < stock <= reorderLevel)
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catLogistics.id,
          sku: 'BHT-LOG-2001',
          name: 'Ergonomic Warehouse Apron',
          description: 'Waterproof heavy-duty canvas utility apron with reinforced tool pouches and adjustable straps',
          unitPrice: 1499.00,
          costPrice: 650.00,
          stockQuantity: 4, // LOW STOCK
          reorderLevel: 10,
          status: ProductStatus.ACTIVE,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catPantry.id,
          sku: 'BHT-PAN-3001',
          name: 'Coorg Single-Estate Arabica Coffee Beans (1kg)',
          description: 'Shade-grown artisanal whole bean roasted coffee for commercial espresso stations',
          unitPrice: 1850.00,
          costPrice: 920.00,
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
          sku: 'BHT-ELC-1003',
          name: 'Thermal Billing Printer',
          description: 'High-speed 80mm wireless Bluetooth POS receipt & tax invoice printer with auto-cutter',
          unitPrice: 12499.00,
          costPrice: 7800.00,
          stockQuantity: 0, // OUT OF STOCK
          reorderLevel: 8,
          status: ProductStatus.OUT_OF_STOCK,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catLogistics.id,
          sku: 'BHT-LOG-2002',
          name: 'High-Visibility Safety Vest (Class 3)',
          description: 'Fluorescent mesh reflective safety jacket with dual horizontal 3M micro-prismatic bands',
          unitPrice: 799.00,
          costPrice: 320.00,
          stockQuantity: 0, // OUT OF STOCK
          reorderLevel: 20,
          status: ProductStatus.OUT_OF_STOCK,
        },
      }),
    ]);

    // 5. Create Orders (COMPLETED, HELD, CANCELLED) with 18% GST calculation
    const order1 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-BHT-2026-0001',
        customerName: 'Tata Consumer Products Logistics',
        customerEmail: 'procurement@tataconsumer.demo',
        status: OrderStatus.COMPLETED,
        totalAmount: 15335.28,
        taxAmount: 2339.28,
        notes: 'Delivered to Mumbai Central warehouse hub with GST invoice.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[0].id,
              quantity: 2,
              unitPrice: 2499.00,
              totalPrice: 4998.00,
            },
            {
              organizationId: org.id,
              productId: products[1].id,
              quantity: 2,
              unitPrice: 3999.00,
              totalPrice: 7998.00,
            },
          ],
        },
      },
    });

    const order2 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-BHT-2026-0002',
        customerName: 'Reliance Retail Fulfilment Hub',
        customerEmail: 'orders@relianceretail.demo',
        status: OrderStatus.HELD,
        totalAmount: 5306.46,
        taxAmount: 809.46,
        notes: 'Held at billing counter pending purchase order stamp approval.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[2].id,
              quantity: 3,
              unitPrice: 1499.00,
              totalPrice: 4497.00,
            },
          ],
        },
      },
    });

    const order3 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-BHT-2026-0003',
        customerName: 'Mahindra Logistics Express',
        customerEmail: 'ops@mahindralogistics.demo',
        status: OrderStatus.CANCELLED,
        totalAmount: 14748.82,
        taxAmount: 2249.82,
        notes: 'Cancelled due to inventory stock-out on billing printer.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[4].id,
              quantity: 1,
              unitPrice: 12499.00,
              totalPrice: 12499.00,
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

async function seedDeccanSupplies() {
  console.log('\n🏔️  [Tenant 2] Seeding Deccan Supply Chain...');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const org = await tx.organization.create({
      data: {
        name: 'Deccan Supply Chain',
        slug: 'deccan-supplies',
        currency: 'INR',
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 2. Create Users (ADMIN, MANAGER, CASHIER)
    const users = await Promise.all([
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'admin@deccan-supplies.in',
          firstName: 'Ananya',
          lastName: 'Iyer',
          passwordHash: defaultPasswordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'manager@deccan-supplies.in',
          firstName: 'Vikram',
          lastName: 'Nair',
          passwordHash: defaultPasswordHash,
          role: UserRole.MANAGER,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'cashier@deccan-supplies.in',
          firstName: 'Sneha',
          lastName: 'Kulkarni',
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
        name: 'Industrial Hardware & Fasteners',
        slug: 'deccan-hardware',
        description: 'High-tensile fasteners, anchor bolts, and industrial brackets',
      },
    });

    const catSafety = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Plant Safety & Protective Equipment',
        slug: 'deccan-safety',
        description: 'ANSI & BIS certified eye shields, respirators, and protective gear',
      },
    });

    // 4. Create Products with Varied Stock Levels & INR Pricing
    const products = await Promise.all([
      // In Stock Items
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catHardware.id,
          sku: 'DEC-HDW-4001',
          name: 'Galvanized Hex Bolt Assortment (Grade 8.8)',
          description: 'High-tensile zinc-plated metric bolts with nyloc nuts (Pack of 150)',
          unitPrice: 3499.00,
          costPrice: 1750.00,
          stockQuantity: 120, // IN STOCK
          reorderLevel: 25,
          status: ProductStatus.ACTIVE,
        },
      }),
      tx.product.create({
        data: {
          organizationId: org.id,
          categoryId: catSafety.id,
          sku: 'DEC-SAF-5001',
          name: 'Polycarbonate Protective Safety Goggles (Anti-Fog)',
          description: 'Scratch-resistant wraparound safety glasses with UV400 and splash shield',
          unitPrice: 899.00,
          costPrice: 380.00,
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
          sku: 'DEC-SAF-5002',
          name: 'Dual-Cartridge Chemical Respirator (FFP3)',
          description: 'Silicone half-face respirator with twin organic vapor and particulate filters',
          unitPrice: 4299.00,
          costPrice: 2350.00,
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
          sku: 'DEC-HDW-4002',
          name: 'Pneumatic Framing Coil Nailer (Industrial)',
          description: 'Heavy-duty magazine pallet and crate manufacturing pneumatic nail gun',
          unitPrice: 18999.00,
          costPrice: 12400.00,
          stockQuantity: 0, // OUT OF STOCK
          reorderLevel: 5,
          status: ProductStatus.OUT_OF_STOCK,
        },
      }),
    ]);

    // 5. Create Orders with 18% GST
    const order1 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-DEC-2026-0001',
        customerName: 'Larsen & Toubro Heavy Civil Infrastructure',
        customerEmail: 'procurement@larsentoubro.demo',
        status: OrderStatus.COMPLETED,
        totalAmount: 16515.28,
        taxAmount: 2519.28,
        notes: 'Hyderabad Metro Project Phase 2 site dispatch completed.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[0].id,
              quantity: 4,
              unitPrice: 3499.00,
              totalPrice: 13996.00,
            },
          ],
        },
      },
    });

    const order2 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-DEC-2026-0002',
        customerName: 'Godrej Process Equipment Division',
        customerEmail: 'safety@godrej.demo',
        status: OrderStatus.HELD,
        totalAmount: 10145.64,
        taxAmount: 1547.64,
        notes: 'Held awaiting site safety audit clearance certificate.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[2].id,
              quantity: 2,
              unitPrice: 4299.00,
              totalPrice: 8598.00,
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
  console.log('   Localization: India Enterprise Edition (INR, GST 18%)');
  console.log('===============================================================');

  await cleanExistingData();
  const bharat = await seedBharatRetail();
  const deccan = await seedDeccanSupplies();

  console.log('\n===============================================================');
  console.log('✅ Seeding Completed Successfully!');
  console.log('===============================================================');
  console.log(`🏢 Organization 1: ${bharat.org.name} (${bharat.org.slug})`);
  console.log(`   - Users: ${bharat.users.length} (Admin: admin@bharat-retail.in, Password: ${DEFAULT_PASSWORD})`);
  console.log(`   - Products: ${bharat.products.length} (In Stock, Low Stock, Out of Stock in INR)`);
  console.log(`   - Orders: ${bharat.orders.length}`);

  console.log(`\n🏢 Organization 2: ${deccan.org.name} (${deccan.org.slug})`);
  console.log(`   - Users: ${deccan.users.length} (Admin: admin@deccan-supplies.in, Password: ${DEFAULT_PASSWORD})`);
  console.log(`   - Products: ${deccan.products.length} (In Stock, Low Stock, Out of Stock in INR)`);
  console.log(`   - Orders: ${deccan.orders.length}`);
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
