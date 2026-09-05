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
import prisma from '../db/client';

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
  async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      const categories = await prisma.category.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: categories });
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ success: false, error: 'FETCH_CATEGORIES_FAILED', message: err.message });
    }
  }
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

export default router;
