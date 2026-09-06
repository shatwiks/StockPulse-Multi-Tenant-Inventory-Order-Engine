# ADR-002: Multi-Tenant Data Partitioning & Isolation Strategy

## Status
`ACCEPTED` (Implemented & Verified in Production Engine)

## Date
2026-03-02

## Context & Problem Statement
StockPulse is an enterprise B2B SaaS platform serving multiple distinct corporate retail organizations (e.g., *Bharat Logistics & Retail*, *Deccan Supply Chain*). Each tenant manages private product catalogs, sensitive wholesale pricing, custom inventory levels, and transactional order histories.

A critical non-functional requirement is **strict tenant data isolation**:
- Zero cross-tenant data leakage (Tenant A must never view or mutate Tenant B's products or orders).
- Low infrastructure and operational overhead.
- Scalable connection pooling and migration management across hundreds of corporate tenants.

---

## Evaluation of Architectural Alternatives

| Model | Architecture | Isolation Level | Scalability & Operations | Cost | Verdict |
|:---|:---|:---|:---|:---|:---|
| **1. Database-Per-Tenant** | Each tenant provisions an isolated PostgreSQL instance or database. | **Highest** (Physical file separation). | **Poor**. Connection pool exhaustion: each Node.js instance needs $K$ connections per tenant. 500 tenants $\times$ 10 connections = 5,000 active DB sockets. Running migrations requires iterating over 500 databases. | High | **REJECTED** |
| **2. Schema-Per-Tenant** | Single database, multiple PostgreSQL schemas (`tenant_bharat.*`, `tenant_deccan.*`). | **High** (Logical schema namespace). | **Moderate**. PostgreSQL catalog (`pg_class`, `pg_attribute`) table bloat at $>1000$ schemas. Switching `search_path` dynamically introduces security vulnerabilities and defeats prepared statement query caches. | Moderate | **REJECTED** |
| **3. Shared Database with Discriminator Column (`organization_id`)** | Single database schema where all tenant-scoped tables include indexed `organization_id` foreign key. | **High** (when enforced via defense-in-depth software & constraint layer). | **Highest**. Single migration step, unified connection pool (10 connections serving all tenants), uniform read-replica horizontal scaling. | Minimal | **ACCEPTED** |

---

## Decision Outcome
We adopted the **Shared Database with Tenant Discriminator (`organization_id`)**, reinforced with a 3-layer Defense-in-Depth isolation architecture:

```
[ Incoming Request: Authorization: Bearer <JWT> ]
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Cryptographic JWT Verification                 │
│ Decodes and validates signature: { organizationId, role} │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Scoped Middleware & Controller Injection       │
│ Automatically binds req.tenantId = req.user.orgId       │
│ Every DB query explicitly forces WHERE organizationId=X │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Database Storage Engine Check Constraints      │
│ Composite unique indexes: UNIQUE(organization_id, sku)  │
│ Foreign keys: ON DELETE RESTRICT                        │
│ Storage checks: CHECK (stock_quantity >= 0)             │
└─────────────────────────────────────────────────────────┘
```

---

## Defense-in-Depth Isolation Implementation

### 1. Cryptographic Authentication & Claims
The JWT payload issued at login encapsulates the verified tenant partition identifier:
```json
{
  "userId": "c7a9161a-6415-46f3-9d10-0a25fae16d49",
  "organizationId": "38a7c293-16f5-46d5-91db-a1923cb12c9b",
  "role": "ADMIN",
  "email": "admin@bharat-retail.in"
}
```

### 2. Mandatory Tenant Scoping in Prisma Queries
No business controller executes an unpartitioned query. Every select, update, and delete is scoped to `organizationId`:
```typescript
// Strict multi-tenant isolation enforced in controller
const products = await prisma.product.findMany({
  where: {
    organizationId: req.user.organizationId, // Injected from verified JWT
    isActive: true,
  },
  orderBy: { updatedAt: 'desc' },
});
```

### 3. Database-Level Composite Indexes
In `schema.prisma`, composite indexes enforce partition uniqueness at the disk page level:
```prisma
model Product {
  id             String       @id @default(uuid())
  organizationId String       @map("organization_id")
  sku            String
  // ...
  @@unique([organizationId, sku])
  @@index([organizationId, status])
  @@map("products")
}
```
This guarantees:
1. `SKU-1001` can exist in Bharat Retail and Deccan Supplies simultaneously without namespace collision.
2. An attempt by Tenant A to update a product with an ID belonging to Tenant B yields an immediate `404 Not Found` or `403 Forbidden` without leaking the existence of Tenant B's record.

---

## Verification & Audit
- **Cross-Tenant Attack Verification**: `npm run test:phase2`
- **Result**: Probing product IDs or order IDs belonging to Tenant B while authenticated with Tenant A's token returns `HTTP 404/403` in 100% of test runs.
