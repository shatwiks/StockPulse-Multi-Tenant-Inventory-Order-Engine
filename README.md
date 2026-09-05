# StockPulse: Multi-Tenant Inventory & Order Engine

[![StockPulse Engine](https://img.shields.io/badge/StockPulse-Enterprise%20B2B%20Engine-8B5CF6?style=for-the-badge&logo=target&logoColor=white)](https://github.com/shatwiks/StockPulse-Multi-Tenant-Inventory-Order-Engine)
[![CI Build Status](https://img.shields.io/github/actions/workflow/status/shatwiks/StockPulse-Multi-Tenant-Inventory-Order-Engine/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI%20BUILD)](https://github.com/shatwiks/StockPulse-Multi-Tenant-Inventory-Order-Engine/actions)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success?style=for-the-badge&logo=w3c&logoColor=white)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Docker](https://img.shields.io/badge/Docker-Ready%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**StockPulse** is a distributed, multi-tenant B2B inventory management platform and high-concurrency Point-of-Sale (POS) order engine. Engineered to solve the mission-critical challenges of inventory contention, POS deadlocks, and cross-tenant data leakage, StockPulse combines pessimistic row-level database locking, strict row-level security isolation, and an accessible dark-walnut executive dashboard.

---

## 📌 Problem Statement & Architecture

### The Concurrency & Isolation Challenge in High-Volume B2B POS
1. **Overselling & Inventory Drift:** Concurrent cashiers and batch orders purchasing the last remaining units simultaneously cause negative stock balances and fulfillment failures.
2. **Deadlocks (PostgreSQL `40P01`):** In multi-item checkouts, when Transaction A locks Product 1 then requests Product 2, while Transaction B locks Product 2 then requests Product 1, cyclical lock-dependency triggers database deadlocks and aborted transactions.
3. **Broken Object-Level Authorization (BOLA / IDOR):** Shared multi-tenant relational schemas risk cross-tenant data exposure and unauthorized price/stock tampering without strict tenant-scoped queries.

### System Architecture & Transaction Flow

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as POS Cashier / Client
    participant Frontend as Next.js 16 (React 19 + TanStack Query)
    participant API as Express API (Hardened Security Gateway)
    participant DB as PostgreSQL 16 (Row-Level Locking Engine)

    Cashier->>Frontend: Click "Complete Payment" (POS Basket)
    Frontend->>API: POST /api/v1/orders (Bearer JWT + Basket Items)
    
    Note over API: 1. Verify JWT & Extract Tenant Context (organization_id)<br/>2. Validate payload schema with Zod<br/>3. Enforce RBAC permissions (CASHIER/MANAGER/ADMIN)
    
    API->>DB: BEGIN TRANSACTION (ISOLATION LEVEL READ COMMITTED)
    
    Note over DB: Deterministic Lock Acquisition (ORDER BY id ASC):<br/>SELECT ... FROM products WHERE id = ANY(...) FOR UPDATE
    
    alt Sufficient Stock for All Items
        DB-->>API: Row Locks Granted & Verified Balances
        API->>DB: UPDATE products SET stock_quantity = stock_quantity - delta
        API->>DB: INSERT INTO orders + INSERT INTO order_items
        API->>DB: COMMIT TRANSACTION
        API-->>Frontend: HTTP 201 Created (Order Receipt & Updated Balances)
        Frontend-->>Cashier: Display Printable Receipt Modal + Trap Focus
    else Insufficient Inventory (Race Condition Shortage)
        DB-->>API: Itemized Stock Shortage Detected
        API->>DB: ROLLBACK TRANSACTION
        API-->>Frontend: HTTP 409 Conflict (code: INSUFFICIENT_STOCK, details: [shortages])
        Frontend-->>Cashier: Trigger 409 Shortage Dialog & Reconcile Cart Quantities
    end
```

---

## ⚡ Key Engineering Highlights

### 1. Deterministic Row-Level Locking (`SELECT ... FOR UPDATE ORDER BY id ASC`)
* **Deadlock Elimination:** By sorting all product UUIDs in strictly ascending order (`ORDER BY id ASC`) prior to acquiring pessimistic row locks inside the transaction, cyclical wait-for graphs ($A \to B$ vs. $B \to A$) are mathematically impossible.
* **Zero Overselling Guarantee:** Stock availability is verified within the active lock boundary. If stock is sufficient, inventory is deducted atomically before the transaction commits.

### 2. Immediate 409 Conflict Rollback & Real-Time Cart Reconciliation
* **ACID Integrity:** When a concurrent transaction claims the remaining inventory milliseconds earlier, StockPulse immediately aborts and rolls back the checkout transaction.
* **Automated POS Cart Reconciliation:** Returns structured shortage details (`productId`, `sku`, `name`, `availableStock`, `requestedQuantity`). The frontend automatically reconciles the cashier's cart to the exact available physical balance and triggers an accessible alert modal.

### 3. Zero-Trust Multi-Tenancy & Integrity Constraints
* **Strict Tenant Scoping:** Every relational table (`organizations`, `users`, `categories`, `products`, `orders`, `order_items`) is partitioned by `organization_id` (UUID) with foreign keys enforcing `ON DELETE CASCADE`.
* **Hardware-Level Negative Stock Defense:** Even if an application bug bypassed validation, PostgreSQL enforces:
  ```sql
  CONSTRAINT "products_stock_quantity_check" CHECK ("stock_quantity" >= 0)
  ```
  Any attempt to drive inventory below zero is aborted at the database engine level.
* **Composite Performance Indexes:** High-speed lookup and unique constraint enforcement:
  * `@@unique([organizationId, sku], name: "unique_org_sku")`
  * `@@index([organizationId, status])`
  * `@@index([organizationId, createdAt(sort: Desc)])`

### 4. Standardized Enterprise API Envelope
Every endpoint strictly adheres to a typed, predictable contract:
* **Success Contract:**
  ```json
  {
    "success": true,
    "data": { ... },
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 128,
      "totalPages": 7
    }
  }
  ```
* **Error Contract:**
  ```json
  {
    "success": false,
    "error": {
      "code": "INSUFFICIENT_STOCK",
      "message": "Insufficient inventory to fulfill order",
      "details": [
        {
          "productId": "6e313f2b-e0dd-4ff7-9770-01e6a579d8cd",
          "sku": "ACME-AUDIO-01",
          "name": "Wireless Noise-Cancelling Headphones",
          "availableStock": 2,
          "requestedQuantity": 5
        }
      ]
    }
  }
  ```

### 5. Tuned Connection Pooling
Production-hardened Prisma connection parameters configured for PostgreSQL:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockpulse_inventory?schema=public&connection_limit=10&pool_timeout=20"
```

### 6. WCAG 2.1 AA Accessibility & Production Audit
* **100% Keyboard & Screen-Reader Accessible:** All interactive dialogs implement `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` with focus trapping and restore-on-close.
* **Zero Form Inconsistencies:** Every form control is bound to an explicit `<label htmlFor="...">`.
* **Automated Audit Suite:** Audited via `npm run test:a11y` during continuous integration.

---

## 🔑 Seeded Demo Credentials

StockPulse seeds two distinct tenant organizations with role-based access control (ADMIN, MANAGER, CASHIER). Default password across all seeded accounts is:

> **Password:** `StockPulse2026!`

| Organization | Role | Email | Permissions & Access Scope |
|---|---|---|---|
| **Acme Retail** (`acme-retail`) | **ADMIN** | `admin@acme-retail.com` | Unrestricted catalog CRUD, price mutations, stock adjustments, order desk. |
| **Acme Retail** (`acme-retail`) | **MANAGER** | `manager@acme-retail.com` | Catalog CRUD, stock reconciliations, order desk. |
| **Acme Retail** (`acme-retail`) | **CASHIER** | `cashier@acme-retail.com` | Read catalog, place POS checkout orders. Price edits and deletions rejected (403). |
| **Summit Supplies** (`summit-supplies`) | **ADMIN** | `admin@summit-supplies.com` | Isolated to Summit Supplies tenant. Cross-tenant queries return 404/403. |
| **Summit Supplies** (`summit-supplies`) | **MANAGER** | `manager@summit-supplies.com` | Summit Supplies inventory & order management. |
| **Summit Supplies** (`summit-supplies`) | **CASHIER** | `cashier@summit-supplies.com` | Summit Supplies POS terminal. |

---

## 🚀 Quickstart Guide

### Option A: Single-Command Docker Setup (Recommended)
Prerequisites: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20+)

```bash
# 1. Clone repository
git clone https://github.com/shatwiks/StockPulse-Multi-Tenant-Inventory-Order-Engine.git
cd StockPulse-Multi-Tenant-Inventory-Order-Engine

# 2. Launch complete stack (Postgres + Express API + Next.js Frontend)
docker compose up --build
```

The stack automatically boots:
* 🌐 **Frontend Web App:** [http://localhost:3000](http://localhost:3000)
* ⚡ **Backend API Server:** [http://localhost:3001](http://localhost:3001)
* 🐘 **PostgreSQL 16 Database:** `localhost:5432` (`stockpulse_inventory`)
* 🔁 **Database Migration & Seed:** Automatically executed during startup via container health checks.

To manually re-seed the Docker database at any time:
```bash
npm run docker:seed
# or: bash scripts/docker-seed.sh
```

---

### Option B: Native Local Development

Prerequisites: Node.js 20+ and running PostgreSQL 16 on port 5432.

```bash
# 1. Install root workspace dependencies
npm install

# 2. Generate Prisma client & apply migrations
npm run db:migrate

# 3. Seed multi-tenant demo organizations and inventory
npm run db:seed

# 4. Start backend API and Next.js frontend concurrently
npm run dev
```

---

## 🧪 Automated Verification & Test Suites

StockPulse includes automated test suites covering integrity constraints, security isolation, and extreme concurrency:

```bash
# 1. Verify WCAG 2.1 AA Accessibility across all components
npm run test:a11y

# 2. Verify Database CHECK constraints (negative stock prevention)
npm run test:constraints

# 3. Verify Phase 2 Security (BOLA/IDOR, RBAC, 10x concurrent checkout stress test)
npm run test:phase2

# 4. Verify Phase 3 End-to-End API Integration & 409 Shortage Reconciler
npm run test:phase3

# 5. Full Production Build (TypeScript compile + Next.js optimization)
npm run build
```

---

## 🛡️ Automated CI/CD (GitHub Actions)

StockPulse enforces strict quality gates on every push and pull request to `main`:
* **Matrix Service Container:** Ephemeral `postgres:16-alpine` with healthcheck probing.
* **Strict Typechecking:** Zero TypeScript errors across `server/` and `frontend/` workspaces.
* **Accessibility Audit:** Validates accessible names, modal contracts, and form labeling.
* **Stress Test Suite:** Executes 10 concurrent transactions against 2 items of stock, verifying exactly 1 order succeeds (201) and 9 conflict cleanly (409) with 0 overselling.
* **Production Build:** Validates Next.js build compilation and static optimization.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
