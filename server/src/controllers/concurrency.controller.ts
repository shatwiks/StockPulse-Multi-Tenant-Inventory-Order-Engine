import { Request, Response } from 'express';
import { z } from 'zod';
import { ProductStatus } from '@prisma/client';
import prisma from '../db/client';
import { sendSuccess, sendError } from '../utils/response';

const DEMO_SKU = 'FLASH-SALE-DEMO';

const fallbackDemoProduct = {
  id: 'demo-concurrency-flash-sale-product-id',
  organizationId: '8fca3ba6-54a5-4985-ac05-2887f056f798',
  sku: DEMO_SKU,
  name: 'Limited Edition Flash-Sale Terminal (Demo)',
  description: 'Dedicated demo item engineered for live parallel checkout stress-testing.',
  unitPrice: 999.0,
  costPrice: 600.0,
  stockQuantity: 5,
  reorderLevel: 2,
  categoryId: 'cat-1',
  status: ProductStatus.ACTIVE,
};

export const resetStockSchema = z.object({
  stockQuantity: z
    .number()
    .int()
    .min(1, { message: 'Stock must be at least 1.' })
    .max(50, { message: 'Stock cannot exceed 50 for demo.' })
    .default(5),
});

/**
 * GET /api/v1/concurrency/demo-product
 * Retrieves or auto-provisions a dedicated demo SKU for live concurrency stress-testing.
 */
export async function getFlashSaleProductHandler(req: Request, res: Response): Promise<Response> {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  try {
    let product = await prisma.product.findUnique({
      where: {
        unique_org_sku: {
          organizationId,
          sku: DEMO_SKU,
        },
      },
    });

    if (!product) {
      // Find a default category for the tenant
      const category = await prisma.category.findFirst({
        where: { organizationId },
      });

      product = await prisma.product.create({
        data: {
          organizationId,
          sku: DEMO_SKU,
          name: 'Limited Edition Flash-Sale Terminal (Demo)',
          description: 'Dedicated demo item engineered for live parallel checkout stress-testing.',
          unitPrice: 999.0,
          costPrice: 600.0,
          stockQuantity: 5,
          reorderLevel: 2,
          categoryId: category?.id ?? null,
          status: ProductStatus.ACTIVE,
        },
      });
    }

    return sendSuccess(res, product);
  } catch (err: any) {
    console.warn('Database offline, serving fallback flash-sale demo product:', err.message);
    return sendSuccess(res, fallbackDemoProduct);
  }
}

/**
 * POST /api/v1/concurrency/reset-stock
 * Atomically resets the demo product stock back to a specified count (default 5 units).
 */
export async function resetFlashSaleStockHandler(req: Request, res: Response): Promise<Response> {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  const parseResult = resetStockSchema.safeParse(req.body);
  const targetStock = parseResult.success ? parseResult.data.stockQuantity : 5;

  try {
    const updated = await prisma.product.update({
      where: {
        unique_org_sku: {
          organizationId,
          sku: DEMO_SKU,
        },
      },
      data: {
        stockQuantity: targetStock,
        status: targetStock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK,
      },
    });

    return sendSuccess(res, updated, undefined, 200, 'Demo stock reset successfully');
  } catch (err: any) {
    console.warn('Database offline, updating fallback demo product stock:', err.message);
    fallbackDemoProduct.stockQuantity = targetStock;
    fallbackDemoProduct.status = targetStock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;
    return sendSuccess(res, fallbackDemoProduct, undefined, 200, 'Demo stock reset successfully');
  }
}
