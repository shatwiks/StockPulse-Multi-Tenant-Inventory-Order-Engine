import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { loginHandler } from '../controllers/auth.controller';
import {
  getProductsHandler,
  createProductHandler,
  updateProductHandler,
  adjustStockHandler,
  deleteProductHandler,
} from '../controllers/product.controller';
import {
  placeOrderHandler,
  getOrdersHandler,
} from '../controllers/order.controller';
import {
  getCategoriesHandler,
  createCategoryHandler,
} from '../controllers/category.controller';
import { getAnalyticsHandler } from '../controllers/analytics.controller';
import {
  getOrganizationHandler,
  updateOrganizationHandler,
  inviteMemberHandler,
} from '../controllers/organization.controller';
import {
  getFlashSaleProductHandler,
  resetFlashSaleStockHandler,
} from '../controllers/concurrency.controller';
import { getSystemHealthHandler } from '../controllers/health.controller';
import {
  getOpenApiSpecHandler,
  getApiDocsUiHandler,
} from '../docs/docs.controller';

const router = Router();

// ============================================================================
// 1. Authentication Routes (Public)
// ============================================================================
router.post('/auth/login', loginHandler);

// ============================================================================
// 2. Categories Routes (Tenant Protected)
// ============================================================================
router.get(
  '/categories',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'CASHIER']),
  getCategoriesHandler
);

router.post(
  '/categories',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  createCategoryHandler
);

// ============================================================================
// 3. Product & Inventory Routes (RBAC Protected)
// ============================================================================

// CASHIER, MANAGER, ADMIN can browse and search products
router.get(
  '/products',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'CASHIER']),
  getProductsHandler
);

// Only MANAGER and ADMIN can create products
router.post(
  '/products',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  createProductHandler
);

// Only MANAGER and ADMIN can edit product details / base prices
router.patch(
  '/products/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  updateProductHandler
);

// Only MANAGER and ADMIN can adjust physical stock counts
router.patch(
  '/products/:id/stock',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  adjustStockHandler
);

// Only MANAGER and ADMIN can delete products
router.delete(
  '/products/:id',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  deleteProductHandler
);

// ============================================================================
// 4. Order & POS Checkout Routes (RBAC Protected)
// ============================================================================

// CASHIER, MANAGER, ADMIN can place orders
router.post(
  '/orders',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'CASHIER']),
  placeOrderHandler
);

// CASHIER, MANAGER, ADMIN can view historical orders
router.get(
  '/orders',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'CASHIER']),
  getOrdersHandler
);

// ============================================================================
// 5. Analytics & Business Intelligence (RBAC Protected)
// ============================================================================

// ADMIN and MANAGER can view aggregated analytics and BI reports
router.get(
  '/analytics',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER']),
  getAnalyticsHandler
);

// ============================================================================
// 6. Organization & Multi-Tenant Management (RBAC Protected)
// ============================================================================

// All authenticated users in tenant can view organization profile & team roster
router.get(
  '/organization',
  authenticateToken,
  requireRole(['ADMIN', 'MANAGER', 'CASHIER']),
  getOrganizationHandler
);

// Only ADMIN can update organization settings
router.patch(
  '/organization',
  authenticateToken,
  requireRole(['ADMIN']),
  updateOrganizationHandler
);

// Only ADMIN can invite/provision new tenant members
router.post(
  '/organization/users',
  authenticateToken,
  requireRole(['ADMIN']),
  inviteMemberHandler
);

// ============================================================================
// 7. Interactive Concurrency Demo & Stress-Test Routes
// ============================================================================

// Fetch or create dedicated demo SKU for live parallel checkout stress-testing
router.get(
  '/concurrency/demo-product',
  authenticateToken,
  getFlashSaleProductHandler
);

// Reset demo SKU stock for repeatable recruiter stress-testing
router.post(
  '/concurrency/reset-stock',
  authenticateToken,
  resetFlashSaleStockHandler
);

// ============================================================================
// 8. System Telemetry & Operational Observability Routes
// ============================================================================

// Returns PostgreSQL connection pool health, latency SLAs, and live audit stream
router.get(
  '/system/health',
  authenticateToken,
  getSystemHealthHandler
);

// ============================================================================
// 9. OpenAPI 3.0 Documentation & Specification Routes (Public)
// ============================================================================
router.get('/openapi.json', getOpenApiSpecHandler);
router.get('/docs', getApiDocsUiHandler);

export default router;
