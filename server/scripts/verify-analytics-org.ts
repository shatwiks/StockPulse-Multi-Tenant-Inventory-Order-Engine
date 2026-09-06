process.env.NODE_ENV = 'test';
import http from 'http';
import { AddressInfo } from 'net';
import { app } from '../src/server';
import prisma from '../src/db/client';

async function runAnalyticsOrgVerification(): Promise<void> {
  console.log('===============================================================');
  console.log('📊 StockPulse Analytics & Organization Multi-Tenant Verification');
  console.log('===============================================================');

  // 1. Ephemeral Test Server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api/v1`;
  console.log(`🚀 Ephemeral test server initialized on port ${port}.`);

  let allTestsPassed = true;

  try {
    // 2. Authentication
    console.log('\n🔑 Authenticating test users across roles and tenants...');
    async function login(email: string, password = 'StockPulse2026!'): Promise<string> {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(`Login failed for ${email}`);
      return data.data.token;
    }

    const bharatAdminToken = await login('admin@bharat-retail.in');
    const bharatCashierToken = await login('cashier@bharat-retail.in');
    const deccanAdminToken = await login('admin@deccan-supplies.in');
    console.log('✅ Tokens retrieved for Bharat Admin, Bharat Cashier, and Deccan Admin.');

    // 3. Test 1: GET /analytics as Admin
    console.log('\n📈 [Test 1] Testing GET /api/v1/analytics as ADMIN...');
    const analyticsRes = await fetch(`${baseUrl}/analytics`, {
      headers: { Authorization: `Bearer ${bharatAdminToken}` },
    });
    const analyticsData = await analyticsRes.json();
    if (analyticsRes.status === 200 && analyticsData.success) {
      console.log(`✅ Analytics retrieved: Total Revenue = ₹${analyticsData.data.summary.totalRevenue}, Inventory Units = ${analyticsData.data.inventoryHealth.totalInventoryUnits}, Categories = ${analyticsData.data.categoryBreakdown.length}`);
    } else {
      console.error(`❌ Expected 200 for analytics, got ${analyticsRes.status}:`, analyticsData);
      allTestsPassed = false;
    }

    // 4. Test 2: GET /analytics as Cashier should be blocked (403)
    console.log('\n🛡️ [Test 2] RBAC: CASHIER should be blocked from GET /analytics (403)...');
    const cashierAnalyticsRes = await fetch(`${baseUrl}/analytics`, {
      headers: { Authorization: `Bearer ${bharatCashierToken}` },
    });
    if (cashierAnalyticsRes.status === 403) {
      console.log('✅ CASHIER was correctly blocked with HTTP 403 Forbidden.');
    } else {
      console.error(`❌ Expected 403, got ${cashierAnalyticsRes.status}`);
      allTestsPassed = false;
    }

    // 5. Test 3: GET /organization profile
    console.log('\n🏢 [Test 3] Testing GET /api/v1/organization...');
    const orgRes = await fetch(`${baseUrl}/organization`, {
      headers: { Authorization: `Bearer ${bharatAdminToken}` },
    });
    const orgData = await orgRes.json();
    if (orgRes.status === 200 && orgData.success && orgData.data.slug === 'bharat-retail') {
      console.log(`✅ Organization profile retrieved: "${orgData.data.name}" (${orgData.data.region}), Members = ${orgData.data.members.length}`);
    } else {
      console.error(`❌ Expected 200 for organization, got ${orgRes.status}:`, orgData);
      allTestsPassed = false;
    }

    // 6. Test 4: RBAC on PATCH /organization (Cashier blocked, Admin allowed)
    console.log('\n🛡️ [Test 4] RBAC on PATCH /organization (CASHIER blocked with 403)...');
    const cashierPatchRes = await fetch(`${baseUrl}/organization`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bharatCashierToken}`,
      },
      body: JSON.stringify({ name: 'Tampered Retail Name' }),
    });
    if (cashierPatchRes.status === 403) {
      console.log('✅ CASHIER was blocked from modifying organization settings (403 Forbidden).');
    } else {
      console.error(`❌ Expected 403, got ${cashierPatchRes.status}`);
      allTestsPassed = false;
    }

    // 7. Test 5: POST /organization/users (Invite team member as Admin)
    const testEmail = `operator.${Date.now()}@bharat-retail.in`;
    console.log(`\n👥 [Test 5] Inviting new team member '${testEmail}' as ADMIN...`);
    const inviteRes = await fetch(`${baseUrl}/organization/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bharatAdminToken}`,
      },
      body: JSON.stringify({
        email: testEmail,
        firstName: 'Devendra',
        lastName: 'Sen',
        role: 'MANAGER',
      }),
    });
    const inviteData = await inviteRes.json();
    if (inviteRes.status === 201 && inviteData.success && inviteData.data.email === testEmail) {
      console.log(`✅ Member invited successfully: ID = ${inviteData.data.id}, Role = ${inviteData.data.role}`);
    } else {
      console.error(`❌ Expected 201, got ${inviteRes.status}:`, inviteData);
      allTestsPassed = false;
    }

    // 8. Test 6: Tenant Isolation (Deccan Supply Chain does NOT see invited member)
    console.log('\n🛡️ [Test 6] Multi-Tenant Isolation: Deccan Supply Chain member roster check...');
    const deccanOrgRes = await fetch(`${baseUrl}/organization`, {
      headers: { Authorization: `Bearer ${deccanAdminToken}` },
    });
    const deccanOrgData = await deccanOrgRes.json();
    const leakedUser = deccanOrgData.data.members.find((m: any) => m.email === testEmail);
    if (!leakedUser) {
      console.log('✅ Team member is strictly isolated to Bharat Logistics & Retail (invisible to Deccan).');
    } else {
      console.error('❌ Critical tenant leak detected! Deccan Supply Chain can see Bharat member.');
      allTestsPassed = false;
    }

    // Clean up created test user
    await prisma.user.delete({ where: { id: inviteData.data.id } });
    console.log('🧹 Cleaned up test user.');
  } catch (err) {
    console.error('❌ Unexpected test error:', err);
    allTestsPassed = false;
  } finally {
    server.close();
    await prisma.$disconnect();
  }

  if (!allTestsPassed) {
    console.error('\n❌ Analytics & Organization verification tests failed.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL ANALYTICS & ORGANIZATION VERIFICATION TESTS PASSED!\n');
    process.exit(0);
  }
}

runAnalyticsOrgVerification();
