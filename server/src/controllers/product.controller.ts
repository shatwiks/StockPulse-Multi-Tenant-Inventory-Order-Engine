import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, ProductStatus } from '@prisma/client';
import prisma from '../db/client';
import { sendSuccess, sendError } from '../utils/response';

// ============================================================================
// 1. Zod Validation Guardrails
// ============================================================================

export const createProductSchema = z.object({
  sku: z
    .string()
    .min(1, { message: 'SKU is required.' })
    .max(100, { message: 'SKU cannot exceed 100 characters.' })
    .trim(),
  name: z
    .string()
    .min(1, { message: 'Product name is required.' })
    .max(255, { message: 'Product name cannot exceed 255 characters.' })
    .trim(),
  description: z.string().max(2000).optional(),
  unitPrice: z
    .number()
    .positive({ message: 'Unit price must be strictly greater than 0.' }),
  costPrice: z
    .number()
    .nonnegative({ message: 'Cost price cannot be negative.' })
    .optional(),
  stockQuantity: z
    .number()
    .int({ message: 'Stock quantity must be an integer.' })
    .nonnegative({ message: 'Stock quantity cannot be negative.' })
    .default(0),
  reorderLevel: z
    .number()
    .int({ message: 'Reorder level must be an integer.' })
    .nonnegative({ message: 'Reorder level cannot be negative.' })
    .default(10),
  categoryId: z.string().uuid({ message: 'Invalid categoryId UUID format.' }).optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(2000).optional(),
  unitPrice: z.number().positive({ message: 'Unit price must be strictly greater than 0.' }).optional(),
  costPrice: z.number().nonnegative({ message: 'Cost price cannot be negative.' }).optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
});

export const adjustStockSchema = z
  .object({
    adjustment: z
      .number()
      .int({ message: 'Stock adjustment must be an integer.' })
      .optional(),
    adjustmentQuantity: z
      .number()
      .int({ message: 'Stock adjustment must be an integer.' })
      .optional(),
    stockQuantity: z
      .number()
      .int({ message: 'Stock quantity must be an integer.' })
      .nonnegative({ message: 'Stock quantity cannot be negative.' })
      .optional(),
  })
  .refine(
    (data) =>
      data.adjustment !== undefined ||
      data.adjustmentQuantity !== undefined ||
      data.stockQuantity !== undefined,
    {
      message:
        'Either "adjustmentQuantity"/"adjustment" (delta) or "stockQuantity" (absolute) must be provided.',
    }
  );

// ============================================================================
// 2. Controller Handlers
// ============================================================================

/**
 * GET /api/v1/products
 * Multi-tenant paginated inventory catalog query with SQL injection sanitization.
 */
export async function getProductsHandler(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Missing tenant context.' });
    return;
  }

  try {
    const {
      page = '1',
      limit = '20',
      search,
      category,
      status,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20)); // Capped at 100 max
    const skip = (pageNum - 1) * take;

    // Strict multi-tenant scoping
    const whereClause: Prisma.ProductWhereInput = {
      organizationId,
    };

    // Category filter (by ID or Category Name)
    if (category && typeof category === 'string' && category.trim().length > 0) {
      const trimmedCategory = category.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedCategory);
      if (isUuid) {
        whereClause.categoryId = trimmedCategory;
      } else {
        whereClause.category = {
          name: { equals: trimmedCategory, mode: 'insensitive' },
        };
      }
    }

    // Status filter: 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK' or ProductStatus
    if (status && typeof status === 'string') {
      const normalizedStatus = status.trim().toUpperCase();
      if (normalizedStatus === 'IN_STOCK') {
        whereClause.stockQuantity = { gt: 0 };
        whereClause.status = ProductStatus.ACTIVE;
      } else if (normalizedStatus === 'LOW_STOCK') {
        whereClause.stockQuantity = { gt: 0, lte: 10 };
      } else if (normalizedStatus === 'OUT_OF_STOCK') {
        whereClause.stockQuantity = { equals: 0 };
      } else if (Object.values(ProductStatus).includes(normalizedStatus as ProductStatus)) {
        whereClause.status = normalizedStatus as ProductStatus;
      }
    }

    // Sanitized search query (parameterized in Prisma)
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitizedSearch = search.trim();
      whereClause.OR = [
        { name: { contains: sanitizedSearch, mode: 'insensitive' } },
        { sku: { contains: sanitizedSearch, mode: 'insensitive' } },
        { description: { contains: sanitizedSearch, mode: 'insensitive' } },
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

    return void sendSuccess(
      res,
      products,
      {
        page: pageNum,
        limit: take,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / take)),
      }
    );
  } catch (err: any) {
    console.error('Error in getProductsHandler:', err);
    return void sendError(
      res,
      'FETCH_PRODUCTS_FAILED',
      'Failed to retrieve product inventory.',
      500
    );
  }
}

/**
 * POST /api/v1/products
 * Protected by requireRole(['ADMIN', 'MANAGER'])
 * Creates a new product securely scoped to the authenticated tenant.
 */
export async function createProductHandler(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return void sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  const parseResult = createProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    return void sendError(
      res,
      'VALIDATION_ERROR',
      'Product payload validation failed.',
      400,
      parseResult.error.flatten().fieldErrors
    );
  }

  const data = parseResult.data;

  try {
    // Check if category belongs to this organization
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, organizationId },
      });
      if (!category) {
        return void sendError(
          res,
          'INVALID_CATEGORY',
          'The specified categoryId does not exist within your organization.',
          400
        );
      }
    }

    // Check SKU uniqueness per tenant
    const existingSku = await prisma.product.findUnique({
      where: {
        unique_org_sku: {
          organizationId,
          sku: data.sku.toUpperCase(),
        },
      },
    });

    if (existingSku) {
      return void sendError(
        res,
        'DUPLICATE_SKU',
        `Product with SKU '${data.sku.toUpperCase()}' already exists in your organization.`,
        409
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        organizationId,
        sku: data.sku.toUpperCase(),
        name: data.name,
        description: data.description ?? null,
        unitPrice: new Prisma.Decimal(data.unitPrice),
        costPrice: data.costPrice !== undefined ? new Prisma.Decimal(data.costPrice) : null,
        stockQuantity: data.stockQuantity,
        reorderLevel: data.reorderLevel,
        status: data.stockQuantity === 0 ? ProductStatus.OUT_OF_STOCK : (data.status ?? ProductStatus.ACTIVE),
        categoryId: data.categoryId ?? null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return void sendSuccess(res, newProduct, undefined, 201);
  } catch (err: any) {
    console.error('Error in createProductHandler:', err);
    return void sendError(
      res,
      'CREATE_PRODUCT_FAILED',
      'Failed to create inventory item.',
      500
    );
  }
}

/**
 * PATCH /api/v1/products/:id
 * Protected by requireRole(['ADMIN', 'MANAGER'])
 * Updates product metadata or base unit prices within the tenant partition.
 */
export async function updateProductHandler(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.organizationId;
  const productId = req.params.id;

  if (!organizationId) {
    return void sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  const parseResult = updateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    return void sendError(
      res,
      'VALIDATION_ERROR',
      'Product update payload validation failed.',
      400,
      parseResult.error.flatten().fieldErrors
    );
  }

  const data = parseResult.data;

  try {
    // Verify product exists and belongs to this tenant
    const existing = await prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!existing) {
      return void sendError(
        res,
        'NOT_FOUND',
        'Product not found within your organization.',
        404
      );
    }

    const updateData: Prisma.ProductUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.unitPrice !== undefined) updateData.unitPrice = new Prisma.Decimal(data.unitPrice);
    if (data.costPrice !== undefined) updateData.costPrice = new Prisma.Decimal(data.costPrice);
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.categoryId !== undefined) {
      updateData.category = { connect: { id: data.categoryId } };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return void sendSuccess(res, updatedProduct);
  } catch (err: any) {
    console.error('Error in updateProductHandler:', err);
    return void sendError(
      res,
      'UPDATE_PRODUCT_FAILED',
      'Failed to update product.',
      500
    );
  }
}

/**
 * PATCH /api/v1/products/:id/stock
 * Protected by requireRole(['ADMIN', 'MANAGER'])
 * Physical stock adjustment with strict non-negative validation.
 */
export async function adjustStockHandler(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.organizationId;
  const productId = req.params.id;

  if (!organizationId) {
    return void sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  const parseResult = adjustStockSchema.safeParse(req.body);
  if (!parseResult.success) {
    return void sendError(
      res,
      'VALIDATION_ERROR',
      'Invalid stock adjustment parameters.',
      400,
      parseResult.error.flatten().fieldErrors
    );
  }

  const { adjustment, adjustmentQuantity, stockQuantity } = parseResult.data;
  const effectiveAdjustment = adjustmentQuantity !== undefined ? adjustmentQuantity : adjustment;

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      return void sendError(
        res,
        'NOT_FOUND',
        'Product not found within your organization.',
        404
      );
    }

    let nextStock: number;
    if (stockQuantity !== undefined) {
      nextStock = stockQuantity;
    } else if (effectiveAdjustment !== undefined) {
      nextStock = product.stockQuantity + effectiveAdjustment;
    } else {
      return void sendError(res, 'BAD_REQUEST', 'Missing adjustment parameter.', 400);
    }

    if (nextStock < 0) {
      return void sendError(
        res,
        'INVALID_STOCK_ADJUSTMENT',
        `Adjustment would result in negative inventory (${nextStock}). Stock count must be >= 0.`,
        400
      );
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: nextStock,
        status: nextStock === 0 ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE,
      },
    });

    return void sendSuccess(res, {
      ...updated,
      previousStock: product.stockQuantity,
      newStock: updated.stockQuantity,
      adjustmentQuantity: effectiveAdjustment,
    });
  } catch (err: any) {
    console.error('Error in adjustStockHandler:', err);
    return void sendError(
      res,
      'ADJUST_STOCK_FAILED',
      'Failed to adjust stock count.',
      500
    );
  }
}

/**
 * DELETE /api/v1/products/:id
 * Protected by requireRole(['ADMIN', 'MANAGER'])
 * Deletes a product within the tenant boundary.
 */
export async function deleteProductHandler(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.organizationId;
  const productId = req.params.id;

  if (!organizationId) {
    return void sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      return void sendError(
        res,
        'NOT_FOUND',
        'Product not found within your organization.',
        404
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return void sendSuccess(
      res,
      { id: productId, deleted: true },
      undefined,
      200,
      `Product '${product.name}' (SKU: ${product.sku}) successfully deleted.`
    );
  } catch (err: any) {
    console.error('Error in deleteProductHandler:', err);
    return void sendError(
      res,
      'DELETE_PRODUCT_FAILED',
      'Failed to delete product. It may be referenced by existing orders.',
      500
    );
  }
}
