import { Router } from 'express';
import { placeOrderHandler } from './orders.controller';
import prisma from '../db/client';

const router = Router();

// ----------------------------------------------------------------------------
// POST /api/v1/orders - Concurrency-Safe Transactional Order Checkout
// ----------------------------------------------------------------------------
router.post('/orders', placeOrderHandler);

// ----------------------------------------------------------------------------
// GET /api/v1/products - Inventory Catalog Query (Multi-Tenant)
// ----------------------------------------------------------------------------
router.get('/products', async (req, res) => {
  try {
    const { organizationId, search, categoryId, status, page = '1', limit = '10' } = req.query;

    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({
        error: 'MISSING_ORGANIZATION_ID',
        message: 'Query parameter "organizationId" (UUID) is required.',
      });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * take;

    const whereClause: any = {
      organizationId,
    };

    if (categoryId && typeof categoryId === 'string') {
      whereClause.categoryId = categoryId;
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      whereClause.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { sku: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [totalCount, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: take,
        totalCount,
        totalPages: Math.ceil(totalCount / take),
      },
    });
  } catch (err: any) {
    console.error('Error fetching products:', err);
    return res.status(500).json({
      error: 'FETCH_PRODUCTS_FAILED',
      message: err.message,
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/v1/orders - Order History Query (Multi-Tenant)
// ----------------------------------------------------------------------------
router.get('/orders', async (req, res) => {
  try {
    const { organizationId } = req.query;
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({
        error: 'MISSING_ORGANIZATION_ID',
        message: 'Query parameter "organizationId" (UUID) is required.',
      });
    }

    const orders = await prisma.order.findMany({
      where: { organizationId },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({
      error: 'FETCH_ORDERS_FAILED',
      message: err.message,
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/v1/products - Create Product in Tenant Catalog
// ----------------------------------------------------------------------------
router.post('/products', async (req, res) => {
  try {
    const {
      organizationId,
      categoryId,
      sku,
      name,
      description,
      unitPrice,
      costPrice = 0,
      stockQuantity = 0,
      reorderPoint = 10,
      status = 'ACTIVE',
    } = req.body;

    if (!organizationId || !sku || !name || unitPrice === undefined) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'organizationId, sku, name, and unitPrice are required.',
      });
    }

    if (stockQuantity < 0) {
      return res.status(400).json({
        error: 'INVALID_STOCK_QUANTITY',
        message: 'Stock quantity cannot be negative (CHECK constraint stock_quantity >= 0).',
      });
    }

    const createdProduct = await prisma.product.create({
      data: {
        organizationId,
        categoryId: categoryId || null,
        sku: String(sku).trim().toUpperCase(),
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        unitPrice: Number(unitPrice),
        costPrice: Number(costPrice),
        stockQuantity: Number(stockQuantity),
        reorderPoint: Number(reorderPoint),
        status: Number(stockQuantity) === 0 ? 'OUT_OF_STOCK' : status,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: createdProduct,
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'DUPLICATE_SKU',
        message: `A product with SKU '${req.body.sku}' already exists for this organization.`,
      });
    }
    return res.status(500).json({
      error: 'CREATE_PRODUCT_FAILED',
      message: err.message,
    });
  }
});

// ----------------------------------------------------------------------------
// PATCH /api/v1/products/:id/stock - Adjust Physical Stock Count
// ----------------------------------------------------------------------------
router.patch('/products/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQuantity, delta } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'PRODUCT_NOT_FOUND',
        message: `Product with ID '${id}' was not found.`,
      });
    }

    let newStock: number;
    if (typeof stockQuantity === 'number') {
      newStock = stockQuantity;
    } else if (typeof delta === 'number') {
      newStock = existing.stockQuantity + delta;
    } else {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'Either stockQuantity (absolute) or delta (relative) must be provided as a number.',
      });
    }

    if (newStock < 0) {
      return res.status(400).json({
        error: 'NEGATIVE_STOCK_NOT_ALLOWED',
        message: `Cannot set stock to ${newStock}. Stock quantity must be non-negative (CHECK constraint stock_quantity >= 0).`,
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stockQuantity: newStock,
        status:
          newStock === 0
            ? 'OUT_OF_STOCK'
            : existing.status === 'OUT_OF_STOCK'
            ? 'ACTIVE'
            : existing.status,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return res.json({
      success: true,
      message: `Stock successfully adjusted for SKU '${updated.sku}'.`,
      data: updated,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('products_stock_quantity_check')) {
      return res.status(409).json({
        error: 'CHECK_CONSTRAINT_VIOLATION',
        message: 'Database check constraint rejected negative stock count.',
      });
    }
    return res.status(500).json({
      error: 'ADJUST_STOCK_FAILED',
      message: err.message,
    });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/v1/products/:id - Delete Product from Catalog
// ----------------------------------------------------------------------------
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    return res.json({
      success: true,
      message: 'Product successfully removed from catalog.',
    });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'PRODUCT_NOT_FOUND',
        message: `Product with ID '${req.params.id}' was not found.`,
      });
    }
    return res.status(500).json({
      error: 'DELETE_PRODUCT_FAILED',
      message: err.message,
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/v1/categories - Categories Catalog Query
// ----------------------------------------------------------------------------
router.get('/categories', async (req, res) => {
  try {
    const { organizationId } = req.query;
    const where: any = {};
    if (organizationId && typeof organizationId === 'string') {
      where.organizationId = organizationId;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'FETCH_CATEGORIES_FAILED',
      message: err.message,
    });
  }
});

export default router;
