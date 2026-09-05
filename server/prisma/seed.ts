import { PrismaClient, OrganizationStatus, UserRole, ProductStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'StockPulse2026!';
const defaultPasswordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

async function cleanExistingData() {
  console.log('🧹 Cleaning existing test organizations data (if any)...');
  const testSlugs = ['aeroshield-dynamics', 'biovanguard-diagnostics'];

  const existingOrgs = await prisma.organization.findMany({
    where: { slug: { in: testSlugs } },
    select: { id: true },
  });

  if (existingOrgs.length > 0) {
    const orgIds = existingOrgs.map((o) => o.id);
    // Due to ON DELETE CASCADE on organization_id, deleting the organization deletes all owned entities
    await prisma.organization.deleteMany({
      where: { id: { in: orgIds } },
    });
    console.log(`   Deleted ${existingOrgs.length} existing test organization(s).`);
  }
}

async function seedOrganization1() {
  console.log('\n🚀 [Org 1] Seeding AeroShield Dynamics (Aerospace & Precision Components)...');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const org = await tx.organization.create({
      data: {
        name: 'AeroShield Dynamics Corp.',
        slug: 'aeroshield-dynamics',
        currency: 'USD',
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 2. Create Users
    const users = await Promise.all([
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'sarah.chen@aeroshield.io',
          firstName: 'Sarah',
          lastName: 'Chen',
          passwordHash: defaultPasswordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'marcus.vance@aeroshield.io',
          firstName: 'Marcus',
          lastName: 'Vance',
          passwordHash: defaultPasswordHash,
          role: UserRole.CASHIER,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'elena.rostova@aeroshield.io',
          firstName: 'Elena',
          lastName: 'Rostova',
          passwordHash: defaultPasswordHash,
          role: UserRole.MANAGER,
          isActive: true,
        },
      }),
    ]);

    // 3. Create Hierarchical Categories
    const catAvionics = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Avionics & Telemetry',
        slug: 'aeroshield-avionics',
        description: 'Guidance, inertial navigation, and telemetry sensors for aerospace systems',
      },
    });

    const catSensors = await tx.category.create({
      data: {
        organizationId: org.id,
        parentId: catAvionics.id,
        name: 'Inertial Sensors & MEMS',
        slug: 'aeroshield-inertial-sensors',
        description: 'Gyroscopes, accelerometers, and IMU subsystems',
      },
    });

    const catHardware = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Titanium & High-Temp Fasteners',
        slug: 'aeroshield-fasteners',
        description: 'MIL-SPEC Titanium Grade 5 and Inconel 718 structural fasteners',
      },
    });

    const catThermal = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Thermal Protection & Tiles',
        slug: 'aeroshield-thermal',
        description: 'Ceramic matrix composite aerogel and high-temperature insulation tiles',
      },
    });

    // 4. Create Products
    const productsData = [
      {
        categoryId: catSensors.id,
        sku: 'ASD-SEN-9100',
        name: 'Tri-Axis MEMS Inertial Rate Gyroscope Assembly',
        description: 'Space-qualified angular velocity sensor module with low drift and SPI/CAN bus interface.',
        unitPrice: 1450.0,
        costPrice: 890.0,
        stockQuantity: 85,
        reorderPoint: 15,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catSensors.id,
        sku: 'ASD-SEN-9250',
        name: 'High-G Precision Triaxial Accelerometer Transducer',
        description: 'Hermetically sealed 500g dynamic accelerometer for atmospheric re-entry telemetry.',
        unitPrice: 820.0,
        costPrice: 460.0,
        stockQuantity: 140,
        reorderPoint: 20,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catHardware.id,
        sku: 'ASD-FST-4010',
        name: 'Grade 5 Titanium Hex Flange Bolts (M8 x 40mm, Pack of 50)',
        description: 'Ti-6Al-4V fasteners meeting AMS4928 spec for airframe and propulsion mounting.',
        unitPrice: 260.0,
        costPrice: 135.0,
        stockQuantity: 650,
        reorderPoint: 100,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catHardware.id,
        sku: 'ASD-FST-8820',
        name: 'Inconel 718 Self-Locking Reduced Hex Nuts (Pack of 100)',
        description: 'Extreme-temperature nickel superalloy nuts rated up to 650°C continuous service.',
        unitPrice: 380.0,
        costPrice: 210.0,
        stockQuantity: 420,
        reorderPoint: 75,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catThermal.id,
        sku: 'ASD-THM-1050',
        name: 'Rigid Ceramic Aerogel Thermal Barrier Tile (300mm x 300mm)',
        description: 'Low-density refractory composite thermal barrier designed for 1400°C peak gradient.',
        unitPrice: 620.0,
        costPrice: 340.0,
        stockQuantity: 45,
        reorderPoint: 10,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catThermal.id,
        sku: 'ASD-THM-2010',
        name: 'Silica-Fiber Flexible Insulation Blanket (1000mm x 500mm)',
        description: 'High-purity silica needle-felt blanket for rocket nozzle nacelle thermal insulation.',
        unitPrice: 490.0,
        costPrice: 275.0,
        stockQuantity: 8, // Low stock demo (< reorderPoint)
        reorderPoint: 15,
        status: ProductStatus.ACTIVE,
      },
    ];

    const products = await Promise.all(
      productsData.map((p) =>
        tx.product.create({
          data: {
            organizationId: org.id,
            categoryId: p.categoryId,
            sku: p.sku,
            name: p.name,
            description: p.description,
            unitPrice: p.unitPrice,
            costPrice: p.costPrice,
            stockQuantity: p.stockQuantity,
            reorderPoint: p.reorderPoint,
            status: p.status,
          },
        })
      )
    );

    // 5. Create Realistic Orders with Order Items
    // Order 1: Delivered
    const order1 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-ASD-2026-0001',
        customerName: 'Lockheed Space Systems',
        customerEmail: 'procurement@lockheed-space.demo',
        status: OrderStatus.DELIVERED,
        totalAmount: 1450.0 * 20 + 620.0 * 10, // $35,200.00
        notes: 'Priority defense contractor delivery via secure courier. Inspection certificate attached.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[0].id, // ASD-SEN-9100
              quantity: 20,
              unitPrice: 1450.0,
              totalPrice: 29000.0,
            },
            {
              organizationId: org.id,
              productId: products[4].id, // ASD-THM-1050
              quantity: 10,
              unitPrice: 620.0,
              totalPrice: 6200.0,
            },
          ],
        },
      },
    });

    // Order 2: Processing
    const order2 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-ASD-2026-0002',
        customerName: 'Blue Horizon Orbital',
        customerEmail: 'supply@bluehorizon.demo',
        status: OrderStatus.PROCESSING,
        totalAmount: 820.0 * 5 + 260.0 * 8 + 380.0 * 5, // $8,080.00
        notes: 'Commercial satellite constellation batch 4 hardware requirements.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[1].id, // ASD-SEN-9250
              quantity: 5,
              unitPrice: 820.0,
              totalPrice: 4100.0,
            },
            {
              organizationId: org.id,
              productId: products[2].id, // ASD-FST-4010
              quantity: 8,
              unitPrice: 260.0,
              totalPrice: 2080.0,
            },
            {
              organizationId: org.id,
              productId: products[3].id, // ASD-FST-8820
              quantity: 5,
              unitPrice: 380.0,
              totalPrice: 1900.0,
            },
          ],
        },
      },
    });

    // Order 3: Pending
    const order3 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-ASD-2026-0003',
        customerName: 'Raytheon Defense Systems',
        customerEmail: 'purchasing@raytheon-def.demo',
        status: OrderStatus.PENDING,
        totalAmount: 1450.0 * 2 + 490.0 * 4, // $4,860.00
        notes: 'Awaiting export control ITAR end-user sign-off before warehouse pick.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[0].id, // ASD-SEN-9100
              quantity: 2,
              unitPrice: 1450.0,
              totalPrice: 2900.0,
            },
            {
              organizationId: org.id,
              productId: products[5].id, // ASD-THM-2010
              quantity: 4,
              unitPrice: 490.0,
              totalPrice: 1960.0,
            },
          ],
        },
      },
    });

    return {
      org,
      userCount: users.length,
      categoryCount: 4,
      productCount: products.length,
      orderCount: 3,
    };
  });
}

async function seedOrganization2() {
  console.log('\n🧬 [Org 2] Seeding BioVanguard Diagnostics (Life Sciences & Lab Consumables)...');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const org = await tx.organization.create({
      data: {
        name: 'BioVanguard Diagnostics S.A.',
        slug: 'biovanguard-diagnostics',
        currency: 'EUR',
        status: OrganizationStatus.ACTIVE,
      },
    });

    // 2. Create Users
    const users = await Promise.all([
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'arun.patel@biovanguard.eu',
          firstName: 'Arun',
          lastName: 'Patel',
          passwordHash: defaultPasswordHash,
          role: UserRole.ADMIN,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'chloe.dubois@biovanguard.eu',
          firstName: 'Chloé',
          lastName: 'Dubois',
          passwordHash: defaultPasswordHash,
          role: UserRole.MANAGER,
          isActive: true,
        },
      }),
      tx.user.create({
        data: {
          organizationId: org.id,
          email: 'hannah.schmidt@biovanguard.eu',
          firstName: 'Hannah',
          lastName: 'Schmidt',
          passwordHash: defaultPasswordHash,
          role: UserRole.CASHIER,
          isActive: true,
        },
      }),
    ]);

    // 3. Create Hierarchical Categories
    const catMolecular = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Molecular Diagnostics & PCR',
        slug: 'biovanguard-molecular',
        description: 'Assays, polymerases, and qPCR amplification kits for diagnostic pathology',
      },
    });

    const catEnzymes = await tx.category.create({
      data: {
        organizationId: org.id,
        parentId: catMolecular.id,
        name: 'Cold-Chain Enzymes & Reagents',
        slug: 'biovanguard-enzymes',
        description: 'Enzymes stored at -20°C requiring cold-chain temperature validation',
      },
    });

    const catAutomation = await tx.category.create({
      data: {
        organizationId: org.id,
        name: 'Robotic Liquid Handler Consumables',
        slug: 'biovanguard-automation',
        description: 'Certified RNase/DNase-free filtered tips and SBS-standard microplates',
      },
    });

    // 4. Create Products
    const productsData = [
      {
        categoryId: catMolecular.id,
        sku: 'BVD-PCR-2001',
        name: 'UltraPure Taq 2X Master Mix (1000 Reactions)',
        description: 'Ready-to-use qPCR master mix with hot-start Taq polymerase and dNTPs.',
        unitPrice: 340.0,
        costPrice: 145.0,
        stockQuantity: 210,
        reorderPoint: 30,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catMolecular.id,
        sku: 'BVD-PCR-4050',
        name: 'Multiplex One-Step RT-qPCR Viral Detection Kit',
        description: 'Clinical diagnostic reverse transcriptase qPCR assay with internal extraction control.',
        unitPrice: 890.0,
        costPrice: 410.0,
        stockQuantity: 65,
        reorderPoint: 15,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catEnzymes.id,
        sku: 'BVD-ENZ-0120',
        name: 'Recombinant Proteinase K Lyophilized (100mg)',
        description: 'High-activity endopeptidase for nucleic acid purification and viral lysis.',
        unitPrice: 175.0,
        costPrice: 68.0,
        stockQuantity: 350,
        reorderPoint: 50,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catAutomation.id,
        sku: 'BVD-AUT-9600',
        name: 'Robotic Filter Tips 200µL (96-Well Rack, 10 Racks/Box)',
        description: 'Sterile, aerosol-barrier pipette tips compatible with Hamilton & Tecan automation.',
        unitPrice: 115.0,
        costPrice: 42.0,
        stockQuantity: 580,
        reorderPoint: 100,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catAutomation.id,
        sku: 'BVD-AUT-3840',
        name: 'Deep-Well Microplates 384-Well Polypropylene (Box of 50)',
        description: 'Virgin polypropylene SBS-format deep well plates for automated high-throughput screening.',
        unitPrice: 210.0,
        costPrice: 85.0,
        stockQuantity: 175,
        reorderPoint: 25,
        status: ProductStatus.ACTIVE,
      },
      {
        categoryId: catEnzymes.id,
        sku: 'BVD-CRYO-0080',
        name: 'Cold-Chain Data Logger Bluetooth Probe (-80°C to +40°C)',
        description: 'NIST-traceable calibration temperature monitor included inside transport shippers.',
        unitPrice: 95.0,
        costPrice: 45.0,
        stockQuantity: 120,
        reorderPoint: 20,
        status: ProductStatus.ACTIVE,
      },
    ];

    const products = await Promise.all(
      productsData.map((p) =>
        tx.product.create({
          data: {
            organizationId: org.id,
            categoryId: p.categoryId,
            sku: p.sku,
            name: p.name,
            description: p.description,
            unitPrice: p.unitPrice,
            costPrice: p.costPrice,
            stockQuantity: p.stockQuantity,
            reorderPoint: p.reorderPoint,
            status: p.status,
          },
        })
      )
    );

    // 5. Create Realistic Orders with Order Items
    // Order 1: Shipped
    const order1 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-BVD-2026-0001',
        customerName: 'Charité University Hospital Berlin',
        customerEmail: 'procurement@charite.demo',
        status: OrderStatus.SHIPPED,
        totalAmount: 890.0 * 10 + 340.0 * 25, // €17,400.00
        notes: 'Maintain dry ice cold pack transit temperature throughout courier shipping.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[1].id, // BVD-PCR-4050
              quantity: 10,
              unitPrice: 890.0,
              totalPrice: 8900.0,
            },
            {
              organizationId: org.id,
              productId: products[0].id, // BVD-PCR-2001
              quantity: 25,
              unitPrice: 340.0,
              totalPrice: 8500.0,
            },
          ],
        },
      },
    });

    // Order 2: Processing
    const order2 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-BVD-2026-0002',
        customerName: 'Institut Pasteur Paris',
        customerEmail: 'lab-orders@pasteur.demo',
        status: OrderStatus.PROCESSING,
        totalAmount: 175.0 * 15 + 115.0 * 30, // €6,075.00
        notes: 'Scheduled for batch preparation in clean room facility.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[2].id, // BVD-ENZ-0120
              quantity: 15,
              unitPrice: 175.0,
              totalPrice: 2625.0,
            },
            {
              organizationId: org.id,
              productId: products[3].id, // BVD-AUT-9600
              quantity: 30,
              unitPrice: 115.0,
              totalPrice: 3450.0,
            },
          ],
        },
      },
    });

    // Order 3: Pending
    const order3 = await tx.order.create({
      data: {
        organizationId: org.id,
        orderNumber: 'ORD-BVD-2026-0003',
        customerName: 'Karolinska Institutet Stockholm',
        customerEmail: 'diagnostics@ki.demo',
        status: OrderStatus.PENDING,
        totalAmount: 340.0 * 5 + 210.0 * 12 + 95.0 * 10, // €5,170.00
        notes: 'Consignment order for molecular biology core testing facility.',
        items: {
          create: [
            {
              organizationId: org.id,
              productId: products[0].id, // BVD-PCR-2001
              quantity: 5,
              unitPrice: 340.0,
              totalPrice: 1700.0,
            },
            {
              organizationId: org.id,
              productId: products[4].id, // BVD-AUT-3840
              quantity: 12,
              unitPrice: 210.0,
              totalPrice: 2520.0,
            },
            {
              organizationId: org.id,
              productId: products[5].id, // BVD-CRYO-0080
              quantity: 10,
              unitPrice: 95.0,
              totalPrice: 950.0,
            },
          ],
        },
      },
    });

    return {
      org,
      userCount: users.length,
      categoryCount: 3,
      productCount: products.length,
      orderCount: 3,
    };
  });
}

async function main() {
  console.log('===============================================================');
  console.log('🌱 StockPulse Multi-Tenant B2B Database Seeder');
  console.log('===============================================================');

  await cleanExistingData();

  const org1 = await seedOrganization1();
  const org2 = await seedOrganization2();

  console.log('\n===============================================================');
  console.log('✅ Seeding Completed Successfully!');
  console.log('===============================================================');
  console.log(`🏢 Organization 1: ${org1.org.name} (${org1.org.slug})`);
  console.log(`   - Users: ${org1.userCount}`);
  console.log(`   - Categories: ${org1.categoryCount}`);
  console.log(`   - Products: ${org1.productCount}`);
  console.log(`   - Orders: ${org1.orderCount}`);
  console.log(`\n🏢 Organization 2: ${org2.org.name} (${org2.org.slug})`);
  console.log(`   - Users: ${org2.userCount}`);
  console.log(`   - Categories: ${org2.categoryCount}`);
  console.log(`   - Products: ${org2.productCount}`);
  console.log(`   - Orders: ${org2.orderCount}`);
  console.log('===============================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error while seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
