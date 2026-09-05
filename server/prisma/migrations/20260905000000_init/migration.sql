-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CASHIER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DRAFT', 'DISCONTINUED', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- -----------------------------------------------------------------------------
-- Table: organizations
-- -----------------------------------------------------------------------------
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- -----------------------------------------------------------------------------
-- Table: users
-- -----------------------------------------------------------------------------
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'CASHIER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") 
        REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "unique_org_email" ON "users"("organization_id", "email");
CREATE INDEX "users_organization_id_role_idx" ON "users"("organization_id", "role");

-- -----------------------------------------------------------------------------
-- Table: categories
-- -----------------------------------------------------------------------------
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_organization_id_fkey" FOREIGN KEY ("organization_id") 
        REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") 
        REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "unique_org_category_slug" ON "categories"("organization_id", "slug");
CREATE INDEX "categories_organization_id_name_idx" ON "categories"("organization_id", "name");

-- -----------------------------------------------------------------------------
-- Table: products
-- -----------------------------------------------------------------------------
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "category_id" UUID,
    "sku" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "cost_price" DECIMAL(12,2) NOT NULL,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "reorder_point" INTEGER NOT NULL DEFAULT 10,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") 
        REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") 
        REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,

    -- Database-level constraint to prevent negative inventory counts
    CONSTRAINT "products_stock_quantity_check" CHECK ("stock_quantity" >= 0)
);

CREATE UNIQUE INDEX "unique_org_sku" ON "products"("organization_id", "sku");

-- Explicit composite indexes:
-- 1. (organization_id, sku)
CREATE INDEX "idx_products_org_sku" ON "products"("organization_id", "sku");

-- 2. (organization_id, created_at DESC)
CREATE INDEX "idx_products_org_created_at_desc" ON "products"("organization_id", "created_at" DESC);

CREATE INDEX "products_organization_id_category_id_idx" ON "products"("organization_id", "category_id");
CREATE INDEX "products_organization_id_status_idx" ON "products"("organization_id", "status");

-- -----------------------------------------------------------------------------
-- Table: orders
-- -----------------------------------------------------------------------------
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "order_number" VARCHAR(100) NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") 
        REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "unique_org_order_number" ON "orders"("organization_id", "order_number");

-- Explicit composite index: (organization_id, created_at DESC)
CREATE INDEX "idx_orders_org_created_at_desc" ON "orders"("organization_id", "created_at" DESC);

CREATE INDEX "orders_organization_id_status_idx" ON "orders"("organization_id", "status");

-- -----------------------------------------------------------------------------
-- Table: order_items
-- -----------------------------------------------------------------------------
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organization_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_items_organization_id_fkey" FOREIGN KEY ("organization_id") 
        REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") 
        REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") 
        REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Database-level constraint to prevent order items with 0 or negative quantities
    CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0)
);

CREATE INDEX "order_items_organization_id_order_id_idx" ON "order_items"("organization_id", "order_id");
CREATE INDEX "order_items_organization_id_product_id_idx" ON "order_items"("organization_id", "product_id");
