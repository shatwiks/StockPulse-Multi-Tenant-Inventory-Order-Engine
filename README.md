# StockPulse: Multi-Tenant Inventory & Order Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Helmet Security](https://img.shields.io/badge/Helmet-Secured-darkgreen?logo=shield&logoColor=white)](https://helmetjs.github.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-29.x-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Zod](https://img.shields.io/badge/Zod-3.24-blueviolet?logo=zod&logoColor=white)](https://zod.dev/)

**StockPulse** is a scalable, enterprise-grade multi-tenant B2B inventory management and Point-of-Sale (POS) order engine. Engineered with row-level tenant isolation, deadlock-free PostgreSQL row-locking (`SELECT ... FOR UPDATE`), database-level integrity constraints (`CHECK stock_quantity >= 0`), hardened security headers, rate limiting, and a high-density, WCAG 2.1 AA accessible Admin Dashboard with dark walnut aesthetics.

---

## 1. Enterprise Security Architecture & Threat Model

StockPulse implements Defense-in-Depth across every layer (Network, Application, Database).

### Multi-Tenant Threat Model & Mitigation Matrix

| Threat / Attack Vector | Risk Level | Target Area | Enterprise Mitigation in StockPulse |
|---|---|---|---|
| **SQL Injection (SQLi)** | Critical | Database Layer | Parameterized queries enforced across all Prisma queries and raw SQL fragments (`$queryRaw` tagged templates with strong parameter binding). |
| **Broken Object-Level Access Control (BOLA / IDOR)** | Critical | API / Tenant Layer | Strict row-level tenant isolation: every tenant query enforces `organization_id` foreign key matching. Cross-tenant reads and mutations return `404 Not Found` or `403 Forbidden`. |
| **Race Conditions / Concurrent Overselling** | Critical | Order Checkout | Deadlock-free row-level locking via `SELECT ... FOR UPDATE` with product IDs sorted in deterministic order (`ORDER BY id ASC`), wrapped in an atomic PostgreSQL transaction. |
| **Negative Stock Data Corruption** | Critical | Data Integrity | Database-level `CONSTRAINT "products_stock_quantity_check" CHECK ("stock_quantity" >= 0)` guarantees that negative stock is rejected at the storage engine level even in case of software bugs. |
| **Parameter Tampering / Invalid Data Types** | High | Input Validation | Strict Zod validation schemas (`z.object({ ... })`) at controller boundaries reject invalid types, negative quantities, or extra unexpected fields. |
| **Cross-Origin Resource Sharing (CORS) Abuse** | High | Network / API | Wildcard origins (`*`) are banned. CORS is strictly restricted to authorized domains via `CLIENT_URL` with explicit method and header whitelisting. |
| **Brute-Force & Denial-of-Service (DoS)** | Medium | API Endpoints | `express-rate-limit` enforces rate limits (200 requests per 15-minute window per IP) on all `/api/` routes. Payload limits (1MB) prevent memory exhaustion. |
| **Clickjacking & MIME-Sniffing** | Medium | HTTP Chrome | `helmet` injects defensive HTTP headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`). |
| **Credential Storage Compromise** | Critical | Authentication | Password hashes generated with `bcrypt` using 10 salt rounds. Plaintext passwords are never persisted. |

---

## 2. Monorepo Organization

The codebase is organized as a decoupled monorepo:

```
StockPulse-Multi-Tenant-Inventory-Order-Engine/
├── docker-compose.yml          # Containerized PostgreSQL 16 database
├── package.json                # Root monorepo workspace scripts
├── .gitignore                  # Environment, build, and module ignore rules
├── README.md                   # Architecture & setup documentation
│
├── server/                     # Backend Workspace (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── api/                # Controllers, validation schemas & routes
│   │   │   ├── orders.controller.ts  # Atomic checkout with row-level locking
│   │   │   └── routes.ts             # REST API routes (/api/v1/...)
│   │   ├── db/                 # Database client singleton (Prisma Client)
│   │   │   └── client.ts
│   │   ├── server.ts           # Express init, Helmet, Rate Limit, CORS
│   │   └── index.ts            # Public server exports
│   ├── prisma/
│   │   ├── schema.prisma       # Multi-tenant PostgreSQL relational schema
│   │   ├── seed.ts             # Realistic 2-tenant seed script (bcrypt)
│   │   └── migrations/         # DDL migrations with CHECK constraints & indexes
│   ├── scripts/
│   │   ├── verify-constraints.ts    # Multi-tenancy & CHECK constraint tests
│   │   └── test-concurrent-checkout.ts # Concurrency race-condition stress test
│   ├── package.json            # Vetted backend dependencies
│   ├── tsconfig.json           # Hardened TypeScript config (strict, exactOptionalPropertyTypes)
│   ├── .env                    # Server runtime environment
│   └── .env.example            # Backend environment template
│
└── frontend/                   # Frontend Workspace (Next.js 16 + React 19)
    ├── app/                    # Next.js App Router (layout, globals.css, fonts)
    ├── components/
    │   ├── dashboard/          # Inventory table, Order Desk POS, top bar, sidebar
    │   │   ├── inventory-view.tsx    # View 1: High-density stock catalog & ledger
    │   │   └── order-desk-view.tsx   # View 2: Split-screen POS terminal & receipts
    │   ├── ui/                 # Base UI / Radix primitives
    │   └── query-provider.tsx  # TanStack Query client provider wrapper
    ├── public/                 # Static assets & textures (walnut wood-grain)
    ├── package.json            # Frontend dependencies (TanStack Query, Base UI)
    ├── tsconfig.json           # Frontend TypeScript configuration
    └── .env.example            # Frontend environment template
```

---

## 3. Entity-Relationship Diagram (ERD)

Every entity is scoped by `organization_id` (UUID) with `ON DELETE CASCADE` to guarantee strict row-level tenant isolation:

```mermaid
erDiagram
    organizations ||--o{ users : "has"
    organizations ||--o{ categories : "owns"
    organizations ||--o{ products : "manages"
    organizations ||--o{ orders : "processes"
    organizations ||--o{ order_items : "tracks"

    categories ||--o{ products : "classifies"
    orders ||--o{ order_items : "contains"
    products ||--o{ order_items : "purchased_in"

    organizations {
        uuid id PK "gen_random_uuid()"
        varchar name "Organization name"
        varchar slug UK "Unique tenant slug"
        varchar currency "USD / EUR (Default: USD)"
        enum status "ACTIVE, SUSPENDED, TRIAL"
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        varchar email "Unique per tenant"
        varchar password_hash "Bcrypt hash (10 rounds)"
        enum role "ADMIN, MANAGER, CASHIER"
        boolean is_active "Active status flag"
        timestamptz created_at
        timestamptz updated_at
    }

    categories {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        varchar name "Category title"
        varchar slug "Scoped category slug"
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    products {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        uuid category_id FK "Category reference"
        varchar sku "Unique per tenant"
        varchar name "Product title"
        text description
        decimal unit_price "Selling price (10,2)"
        decimal cost_price "COGS / Cost price (10,2)"
        integer stock_quantity "CHECK (stock_quantity >= 0)"
        integer reorder_level "Threshold indicator (default: 10)"
        enum status "ACTIVE, DRAFT, DISCONTINUED, OUT_OF_STOCK"
        timestamptz created_at
        timestamptz updated_at
    }

    orders {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        varchar order_number "Unique per tenant"
        varchar customer_name
        varchar customer_email
        decimal total_amount "Order sum (10,2)"
        decimal tax_amount "Order tax (10,2)"
        enum status "COMPLETED, HELD, CANCELLED"
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    order_items {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        uuid order_id FK "Parent order (CASCADE)"
        uuid product_id FK "Product item (RESTRICT)"
        integer quantity "CHECK (quantity > 0)"
        decimal unit_price "Snapshotted price (10,2)"
        decimal total_price "Line total (10,2)"
        timestamptz created_at
        timestamptz updated_at
    }
```

### Composite Indexes & Database Constraints
1. **Composite Index `(organization_id, sku)`**:
   Enforces rapid SKU lookups scoped to each tenant while guaranteeing uniqueness within that tenant's partition.
2. **Composite Index `(organization_id, created_at DESC)`**:
   Optimizes paginated catalog feeds and historical order queries without table-scan penalties.
3. **Storage Constraint `CHECK (stock_quantity >= 0)`**:
   Guarantees that negative stock cannot be persisted at the storage engine level.
4. **Storage Constraint `CHECK (quantity > 0)`**:
   Guarantees order items contain positive quantities.

---

## 4. Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or v24 LTS)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/shatwiks/StockPulse-Multi-Tenant-Inventory-Order-Engine.git
cd StockPulse-Multi-Tenant-Inventory-Order-Engine
```

---

### Step 2: Configure Environment Variables

**Backend (`server/.env`)**:
```bash
cp server/.env.example server/.env
```
Contents:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockpulse_inventory?schema=public"
NODE_ENV="development"
PORT=3001
CLIENT_URL="http://localhost:5173"
JWT_SECRET="enterprise-grade-stockpulse-jwt-secret-key-replace-in-production"
```

**Frontend (`frontend/.env`)**:
```bash
cp frontend/.env.example frontend/.env
```
Contents:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_DEFAULT_ORG_ID="8fca3ba6-54a5-4985-ac05-2887f056f798"
```

---

### Step 3: Start the PostgreSQL Database

Spin up the containerized PostgreSQL 16 database:
```bash
docker compose up -d
```

Verify container health:
```bash
docker ps --filter "name=stockpulse-postgres"
```

---

### Step 4: Install Dependencies & Run Database Migrations

Install dependencies across the monorepo:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

Deploy migrations and populate seed data:
```bash
# Run Prisma migration
npm run db:migrate

# Seed 2 realistic organizations (Acme Retail & Summit Supplies)
npm run db:seed
```

---

### Step 5: Verify Security Constraints & Concurrency Locking

Execute the automated test suites:

```bash
# Test 1: Verify multi-tenant isolation and CHECK constraints
npm run test:constraints

# Test 2: Concurrency stress test (Row-locking & 409 Conflict rollback)
npm run test:checkout
```

Expected output for `test:checkout`:
```
===============================================================
⚡ Concurrency Race-Condition & Row-Locking Test
===============================================================
📦 Created test product 'High-Precision Laser Transponder (Race Test Item)' (10 units)
🚀 Dispatching 2 concurrent checkouts requesting 7 units each (Total: 14 units)...
   ✅ Buyer A: SUCCESS! Order created -> CONCUR-ORD-1788617015751-723
   🛑 Buyer B: REJECTED WITH 409 CONFLICT! (Insufficient stock: Requested: 7, Available: 3)
🔍 Final Database State: Stock = 3 units
🎉 PASS: Row-level locking prevented race condition, overselling, and negative stock!
```

---

### Step 6: Start the Applications

```bash
# Terminal 1: Backend API (Express + TypeScript on http://localhost:3001)
npm run dev:server

# Terminal 2: Frontend Dashboard (Next.js 16 on http://localhost:3000)
npm run dev:frontend
```

---

## 5. Seed Accounts

All accounts are pre-seeded with bcrypt-hashed passwords (10 salt rounds): **`StockPulse2026!`**.

| Tenant Organization | Tenant Slug | User Email | Role | Sample Stock Items |
|---|---|---|---|---|
| **Acme Retail** | `acme-retail` | `admin@acme-retail.com` | `ADMIN` | In Stock (Headphones, Chargers) |
| Acme Retail | `acme-retail` | `manager@acme-retail.com` | `MANAGER` | Low Stock (Aprons, Coffee Beans) |
| Acme Retail | `acme-retail` | `cashier@acme-retail.com` | `CASHIER` | Out of Stock (Thermal Printers) |
| **Summit Supplies** | `summit-supplies` | `admin@summit-supplies.com` | `ADMIN` | In Stock (Bolt Sets, Glasses) |
| Summit Supplies | `summit-supplies` | `manager@summit-supplies.com` | `MANAGER` | Low Stock (Respirators) |
| Summit Supplies | `summit-supplies` | `cashier@summit-supplies.com` | `CASHIER` | Out of Stock (Framing Nailers) |

---

## License
ISC License. Built for high-reliability multi-tenant supply chain and B2B point-of-sale infrastructure.
