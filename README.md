# StockPulse: Multi-Tenant Inventory & Order Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-29.x-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Zod](https://img.shields.io/badge/Zod-3.24-blueviolet?logo=zod&logoColor=white)](https://zod.dev/)

**StockPulse** is a scalable, enterprise-grade multi-tenant B2B inventory management and Point-of-Sale (POS) order engine. Engineered with row-level tenant isolation, deadlock-free PostgreSQL row-locking (`SELECT ... FOR UPDATE`), database-level integrity constraints (`CHECK stock_quantity >= 0`), and a high-density, WCAG 2.1 AA accessible Admin Dashboard with dark walnut aesthetics.

---

## Repository Structure

The repository is organized into a clean monorepo containing decoupled `frontend` and `server` workspaces:

```
StockPulse-Multi-Tenant-Inventory-Order-Engine/
├── docker-compose.yml          # Containerized PostgreSQL 16 database
├── package.json                # Monorepo orchestration scripts
├── .gitignore                  # Git ignore rules for workspaces & env
├── .env.example                # Global environment configuration template
│
├── server/                     # Backend Workspace (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── api/                # Controllers, validation schemas & routes
│   │   │   ├── orders.controller.ts  # Atomic checkout endpoint with row locking
│   │   │   └── routes.ts             # REST API routes (/api/v1/...)
│   │   ├── db/                 # Database client singleton (Prisma Client)
│   │   │   └── client.ts
│   │   ├── server.ts           # Express application initialization & middleware
│   │   └── index.ts            # Public server exports
│   ├── prisma/
│   │   ├── schema.prisma       # Multi-tenant PostgreSQL relational schema
│   │   ├── seed.ts             # Realistic multi-organization seed script
│   │   └── migrations/         # DDL migrations with CHECK constraints & indexes
│   ├── scripts/
│   │   ├── verify-constraints.ts    # Multi-tenancy & CHECK constraint tests
│   │   └── test-concurrent-checkout.ts # Concurrency race-condition stress test
│   ├── package.json            # Server dependencies (Express, Prisma, Zod, bcrypt, JWT)
│   ├── tsconfig.json           # Backend TypeScript configuration
│   └── .env                    # Server database connection string
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
    └── tsconfig.json           # Frontend TypeScript configuration
```

---

## System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Frontend)"]
        UI1["Inventory Management View\n(Stock Catalog & Live Ledger)"]
        UI2["Order Desk POS View\n(Split-screen POS & Receipts)"]
        TQ["TanStack Query (React Query v5)\nuseQuery + useMutation Cache Invalidation"]
        UI1 --> TQ
        UI2 --> TQ
    end

    subgraph APILayer ["Backend API Layer (Express + TypeScript)"]
        ROUTER["Express Router (/api/v1)"]
        AUTH["JWT / Tenant Middleware\n(organization_id resolution)"]
        VAL["Zod Validation Layer\n(Request Body & DTO Schemas)"]
        ORDERS["Orders Controller\n(Atomic Transaction & Deadlock-Free Locking)"]
        PRODUCTS["Products Controller\n(Pagination, Search, Category Filters)"]

        TQ -->|HTTP REST| ROUTER
        ROUTER --> AUTH
        AUTH --> VAL
        VAL --> ORDERS
        VAL --> PRODUCTS
    end

    subgraph DataLayer ["Data Layer (PostgreSQL 16 Engine)"]
        TX["Explicit DB Transaction\nprisma.$transaction(...)"]
        LOCK["SELECT ... FOR UPDATE\nSorted product IDs (Deterministic Lock Order)"]
        CHECK["CHECK Constraints\nstock_quantity >= 0\nquantity > 0"]
        INDEXES["Composite Indexes\n(organization_id, sku)\n(organization_id, created_at DESC)"]

        ORDERS --> TX
        TX --> LOCK
        LOCK --> CHECK
        CHECK --> INDEXES
    end
```

---

## Entity-Relationship Diagram (ERD)

Every entity is scoped by `organization_id` (UUID) with `ON DELETE CASCADE` to guarantee strict row-level tenant isolation:

```mermaid
erDiagram
    organizations ||--o{ users : "has"
    organizations ||--o{ categories : "owns"
    organizations ||--o{ products : "manages"
    organizations ||--o{ orders : "processes"
    organizations ||--o{ order_items : "tracks"

    categories ||--o{ categories : "sub-category (parent_id)"
    categories ||--o{ products : "classifies"
    orders ||--o{ order_items : "contains"
    products ||--o{ order_items : "purchased_in"

    organizations {
        uuid id PK "gen_random_uuid()"
        varchar name "Organization legal name"
        varchar slug UK "Unique tenant slug"
        varchar currency "USD / EUR (Default: USD)"
        enum status "ACTIVE, SUSPENDED, TRIAL"
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        varchar email "User corporate email"
        varchar first_name
        varchar last_name
        varchar password_hash "Bcrypt hash"
        enum role "ADMIN, MANAGER, CASHIER"
        boolean is_active "Active status flag"
        timestamptz created_at
        timestamptz updated_at
    }

    categories {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        uuid parent_id FK "Self-referencing hierarchy"
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
        varchar sku "Stock Keeping Unit"
        varchar name "Product name"
        text description
        decimal unit_price "Selling price (12,2)"
        decimal cost_price "COGS / Cost price (12,2)"
        integer stock_quantity "CHECK (stock_quantity >= 0)"
        integer reorder_point "Threshold indicator"
        enum status "ACTIVE, DRAFT, DISCONTINUED, OUT_OF_STOCK"
        timestamptz created_at
        timestamptz updated_at
    }

    orders {
        uuid id PK "gen_random_uuid()"
        uuid organization_id FK "Tenant ID (CASCADE)"
        varchar order_number "Scoped order number"
        varchar customer_name
        varchar customer_email
        enum status "PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED"
        decimal total_amount "Order sum (12,2)"
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
        decimal unit_price "Snapshotted price (12,2)"
        decimal total_price "Line total (12,2)"
        timestamptz created_at
        timestamptz updated_at
    }
```

### Key Database Guarantees
1. **Multi-Tenant Composite Indexes**:
   - `idx_products_org_sku`: `(organization_id, sku)` for $O(1)$ tenant SKU lookup.
   - `idx_products_org_created_at_desc`: `(organization_id, created_at DESC)` for high-speed paginated inventory catalogs.
   - `idx_orders_org_created_at_desc`: `(organization_id, created_at DESC)` for tenant order histories.
2. **Database-Level CHECK Constraints**:
   - `CONSTRAINT "products_stock_quantity_check" CHECK ("stock_quantity" >= 0)`
   - `CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0)`
3. **Deadlock-Free Row-Level Locking (`SELECT ... FOR UPDATE`)**:
   - All product IDs in an order are sorted alphabetically (`uniqueProductIds.sort()`) before acquiring locks.
   - All concurrent checkout transactions acquire locks in identical sequential order, preventing PostgreSQL `40P01` deadlocks.
   - If stock is insufficient, the transaction cleanly rolls back and returns **HTTP 409 Conflict**.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or v24 LTS recommended)
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

1. Copy the example environment file for the server:
   ```bash
   cp .env.example server/.env
   ```
2. Inspect `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockpulse_inventory?schema=public"
   PORT=3001
   JWT_SECRET="super-secret-stockpulse-enterprise-jwt-key-2026"
   NODE_ENV="development"
   ```

---

### Step 3: Start the PostgreSQL Database

Spin up the containerized PostgreSQL 16 database using Docker Compose:
```bash
docker compose up -d
```

Verify that the database container is healthy:
```bash
docker ps --filter "name=stockpulse-postgres"
```

---

### Step 4: Install Dependencies & Run Database Migrations

Install dependencies for the backend and frontend workspaces:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

Apply database migrations and populate seed data:
```bash
# Run Prisma migration
npm run db:migrate

# Seed 2 realistic organizations (AeroShield Dynamics & BioVanguard Diagnostics)
npm run db:seed
```

---

### Step 5: Verify Database Constraints & Concurrency Locking

Run the automated test suites to verify database constraints and concurrency row-locking:

```bash
# Test 1: Verify multi-tenant isolation and CHECK constraints
npm run test:constraints

# Test 2: Concurrency stress test (SELECT ... FOR UPDATE & 409 Conflict rollback)
npm run test:checkout
```

Expected output for `test:checkout`:
```
⚡ Concurrency Race-Condition & Row-Locking Test
📦 Created test product 'High-Precision Laser Transponder (Race Test Item)' (10 units)
🚀 Dispatching 2 concurrent checkouts requesting 7 units each (Total: 14 units)...
   ✅ Buyer A: SUCCESS! Order created
   🛑 Buyer B: REJECTED WITH 409 CONFLICT! (Insufficient stock: Requested: 7, Available: 3)
🔍 Final Database State: Stock = 3 units
🎉 PASS: Row-level locking prevented race condition, overselling, and negative stock!
```

---

### Step 6: Start the Applications

Run the backend and frontend development servers:

```bash
# Terminal 1: Backend API (Express + TypeScript on http://localhost:3001)
npm run dev:server

# Terminal 2: Frontend Dashboard (Next.js 16 on http://localhost:3000)
npm run dev:frontend
```

Open your browser at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied) to explore the **StockPulse Admin Dashboard**.

---

## Seed Accounts

The seeder initializes two enterprise organizations with active user credentials (default password: `StockPulse2026!`):

| Organization | Tenant Slug | User Email | Role | Currency |
|---|---|---|---|---|
| **AeroShield Dynamics Corp.** | `aeroshield-dynamics` | `sarah.chen@aeroshield.io` | `ADMIN` | USD ($) |
| AeroShield Dynamics Corp. | `aeroshield-dynamics` | `elena.rostova@aeroshield.io` | `MANAGER` | USD ($) |
| AeroShield Dynamics Corp. | `aeroshield-dynamics` | `marcus.vance@aeroshield.io` | `CASHIER` | USD ($) |
| **BioVanguard Diagnostics S.A.** | `biovanguard-diagnostics` | `arun.patel@biovanguard.eu` | `ADMIN` | EUR (€) |
| BioVanguard Diagnostics S.A. | `biovanguard-diagnostics` | `chloe.dubois@biovanguard.eu` | `MANAGER` | EUR (€) |
| BioVanguard Diagnostics S.A. | `biovanguard-diagnostics` | `hannah.schmidt@biovanguard.eu` | `CASHIER` | EUR (€) |

---

## License
ISC License. Built for high-reliability multi-tenant supply chain and B2B point-of-sale infrastructure.
