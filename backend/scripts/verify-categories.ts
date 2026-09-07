process.env.NODE_ENV = 'test';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../src/server';
import prisma from '../src/db/client';

async function runCategoryVerification(): Promise<void> {
  console.log('===============================================================');
  console.log('📦  StockPulse Category API & Multi-Tenant Isolation Verification');
  console.log('===============================================================');

  // 1. Start Ephemeral Test Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`🚀 Ephemeral test server initialized on port ${port}.`);

  let allTestsPassed = true;

  try {
    // 2. Login as Bharat Retail Admin, Manager, and Cashier
    console.log('\n🔑 Authenticating test users...');
    async function login(email: string, password = 'StockPulse2026!'): Promise<string> {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
      return data.data.token;
    }

    const bharatAdminToken = await login('admin@bharat-retail.in');
    const bharatManagerToken = await login('manager@bharat-retail.in');
    const bharatCashierToken = await login('cashier@bharat-retail.in');
    const deccanAdminToken = await login('admin@deccan-supplies.in');
    console.log('✅ Tokens retrieved for all tenant roles.');

    // 3. Test 1: CASHIER cannot create category (403 Forbidden)
    console.log('\n🛡️ [Test 1] Enforcing RBAC: CASHIER should be rejected (403 Forbidden)...');
    const cashierRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bharatCashierToken}`,
      },
      body: JSON.stringify({
        name: 'Unauthorized Cashier Category',
      }),
    });
    const cashierData = await cashierRes.json();
    if (cashierRes.status === 403) {
      console.log('✅ CASHIER was correctly blocked with HTTP 403 Forbidden.');
    } else {
      console.error(`❌ Expected 403, got ${cashierRes.status}:`, cashierData);
      allTestsPassed = false;
    }

    // 4. Test 2: Validation rejection on empty name (422 Unprocessable)
    console.log('\n🛡️ [Test 2] Zod validation guardrails on empty name (422)...');
    const invalidRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bharatAdminToken}`,
      },
      body: JSON.stringify({
        name: '',
      }),
    });
    const invalidData = await invalidRes.json();
    if (invalidRes.status === 422 && invalidData.error?.code === 'VALIDATION_FAILED') {
      console.log('✅ Empty category name rejected with HTTP 422.');
    } else {
      console.error(`❌ Expected 422, got ${invalidRes.status}:`, invalidData);
      allTestsPassed = false;
    }

    // 5. Test 3: ADMIN creates new category
    const testCategoryName = `Automation Gear ${Date.now()}`;
    console.log(`\n🛡️ [Test 3] ADMIN creates new category '${testCategoryName}'...`);
    const createRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bharatAdminToken}`,
      },
      body: JSON.stringify({
        name: testCategoryName,
        description: 'Industrial robotics and conveyor belt control sensors',
      }),
    });
    const createData = await createRes.json();
    if (createRes.status === 201 && createData.success && createData.data.name === testCategoryName) {
      console.log(`✅ Category created successfully (ID: ${createData.data.id}, Slug: ${createData.data.slug}).`);
    } else {
      console.error(`❌ Expected 201, got ${createRes.status}:`, createData);
      allTestsPassed = false;
    }

    // 6. Test 4: Duplicate slug returns 409 Conflict
    console.log('\n🛡️ [Test 4] Detecting duplicate slug within tenant (409 Conflict)...');
    const duplicateRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bharatManagerToken}`,
      },
      body: JSON.stringify({
        name: testCategoryName,
      }),
    });
    const duplicateData = await duplicateRes.json();
    if (duplicateRes.status === 409 && duplicateData.error?.code === 'CATEGORY_SLUG_EXISTS') {
      console.log('✅ Duplicate category slug correctly returned HTTP 409 Conflict.');
    } else {
      console.error(`❌ Expected 409, got ${duplicateRes.status}:`, duplicateData);
      allTestsPassed = false;
    }

    // 7. Test 5: Tenant Isolation Check
    console.log('\n🛡️ [Test 5] Strict Tenant Isolation verification...');
    const deccanListRes = await fetch(`${baseUrl}/categories`, {
      headers: { Authorization: `Bearer ${deccanAdminToken}` },
    });
    const deccanListData = await deccanListRes.json();
    const leakedCategory = deccanListData.data.find((c: any) => c.name === testCategoryName);
    if (!leakedCategory) {
      console.log('✅ Category created by Bharat Logistics is completely INVISIBLE to Deccan Supply Chain.');
    } else {
      console.error('❌ Critical tenant leak! Category visible across tenant boundaries.');
      allTestsPassed = false;
    }

    // 8. Test 6: MANAGER can create a category
    const mgrCategoryName = `Safety Protocols ${Date.now()}`;
    console.log(`\n🛡️ [Test 6] MANAGER creates category '${mgrCategoryName}'...`);
    const mgrCreateRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bharatManagerToken}`,
      },
      body: JSON.stringify({
        name: mgrCategoryName,
      }),
    });
    const mgrCreateData = await mgrCreateRes.json();
    if (mgrCreateRes.status === 201 && mgrCreateData.success) {
      console.log(`✅ MANAGER successfully created category '${mgrCategoryName}'.`);
    } else {
      console.error(`❌ Expected 201, got ${mgrCreateRes.status}:`, mgrCreateData);
      allTestsPassed = false;
    }
  } catch (err) {
    console.error('❌ Unexpected test error:', err);
    allTestsPassed = false;
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  if (!allTestsPassed) {
    console.error('\n❌ One or more category verification tests failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CATEGORY VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runCategoryVerification();
