import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, OrderStatus } from '@prisma/client';
import prisma from '../db/client';
import { sendSuccess, sendError } from '../utils/response';

// ============================================================================
// 1. Zod Request Validation Guardrails
// ============================================================================

export const placeOrderItemSchema = z.object({
  productId: z.string().uuid({ message: 'Invalid productId format. Must be a valid UUID.' }),
  quantity: z
    .number()
    .int({ message: 'Quantity must be an integer.' })
    .positive({ message: 'Quantity must be strictly greater than 0.' }),
});

export const placeOrderSchema = z.object({
  customerName: z
    .string()
    .min(1, { message: 'Customer name is required.' })
    .max(255, { message: 'Customer name cannot exceed 255 characters.' })
    .trim(),
  customerEmail: z
    .string()
    .email({ message: 'Customer email must be a valid email address.' })
    .max(255, { message: 'Customer email cannot exceed 255 characters.' })
    .optional(),
  notes: z.string().max(1000).optional(),
  items: z
    .array(placeOrderItemSchema)
    .min(1, { message: 'Order must contain at least one item.' }),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export interface ProductShortage {
  productId: string;
  sku: string;
  name: string;
  availableStock: number;
  requestedQuantity: number;
}

export class InsufficientStockError extends Error {
  public readonly statusCode = 409;
  public readonly code = 'INSUFFICIENT_STOCK';
  public readonly shortages: ProductShortage[];

  constructor(shortages: ProductShortage[]) {
    const summary = shortages
      .map((s) => `'${s.name}' (SKU: ${s.sku}) - Requested: ${s.requestedQuantity}, Available: ${s.availableStock}`)
      .join('; ');
    super(`Insufficient inventory to fulfill order: ${summary}`);
    this.name = 'InsufficientStockError';
    this.shortages = shortages;
  }
}

// ============================================================================
// 2. Controller Handlers
// ============================================================================

/**
 * POST /api/v1/orders
 * Protected by requireRole(['ADMIN', 'MANAGER', 'CASHIER'])
 *
 * Atomic, Concurrency-Safe Order Checkout Engine with Deterministic Row-Level Locking:
 * 1. Collects unique product IDs and sorts them in ascending order to prevent deadlocks (40P01).
 * 2. Acquires row locks using `SELECT ... FOR UPDATE` inside an explicit transaction.
 * 3. Evaluates stock counts; aborts with 409 Conflict and shortage list if insufficient.
 * 4. Deducts stock counts atomically.
 * 5. Computes subtotal, fixed Decimal 8.875% tax, and writes Order + OrderItems.
 * 6. Returns the completed order receipt.
 */
export async function placeOrderHandler(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return void sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  const parseResult = placeOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return void sendError(
      res,
      'VALIDATION_ERROR',
      'Invalid order placement request payload.',
      400,
      parseResult.error.flatten().fieldErrors
    );
  }

  const { customerName, customerEmail, notes, items } = parseResult.data;

  // Consolidate duplicate product entries in the same basket
  const quantityByProduct = new Map<string, number>();
  for (const item of items) {
    const current = quantityByProduct.get(item.productId) || 0;
    quantityByProduct.set(item.productId, current + item.quantity);
  }

  // Sort unique product IDs to guarantee identical lock acquisition order across concurrent checkouts
  const sortedProductIds = Array.from(quantityByProduct.keys()).sort();

  try {
    const createdOrder = await prisma.$transaction(
      async (tx) => {
        // 1. Acquire Deadlock-Free Row-Level Locks
        const lockedProducts: Array<{
          id: string;
          name: string;
          sku: string;
          unit_price: string | number;
          stock_quantity: number;
          status: string;
        }> = await tx.$queryRaw`
          SELECT id, name, sku, unit_price, stock_quantity, status
          FROM "products"
          WHERE id = ANY(${sortedProductIds}::uuid[]) 
            AND organization_id = ${organizationId}::uuid
          ORDER BY id ASC
          FOR UPDATE;
        `;

        // 2. Validate Tenant Ownership & Existence
        const lockedProductMap = new Map(lockedProducts.map((p) => [p.id, p]));
        const missingIds = sortedProductIds.filter((id) => !lockedProductMap.has(id));

        if (missingIds.length > 0) {
          throw {
            status: 404,
            code: 'PRODUCT_NOT_FOUND',
            message: `One or more requested products do not exist in your organization catalog.`,
            missingProductIds: missingIds,
          };
        }

        // 3. Evaluate Stock Sufficiency for all items
        const shortages: ProductShortage[] = [];

        for (const [productId, requestedQty] of quantityByProduct.entries()) {
          const product = lockedProductMap.get(productId)!;

          if (product.status !== 'ACTIVE') {
            throw {
              status: 400,
              code: 'PRODUCT_UNAVAILABLE',
              message: `Product '${product.name}' (SKU: ${product.sku}) is unavailable for purchase (status: ${product.status}).`,
            };
          }

          if (product.stock_quantity < requestedQty) {
            shortages.push({
              productId: product.id,
              sku: product.sku,
              name: product.name,
              availableStock: product.stock_quantity,
              requestedQuantity: requestedQty,
            });
          }
        }

        // If any item is short on stock, abort and rollback immediately
        if (shortages.length > 0) {
          throw new InsufficientStockError(shortages);
        }

        // 4. Deduct Inventory Counts Atomically
        for (const [productId, requestedQty] of quantityByProduct.entries()) {
          await tx.product.update({
            where: { id: productId },
            data: {
              stockQuantity: {
                decrement: requestedQty,
              },
            },
          });
        }

        // 5. Calculate Subtotal, Tax, and Grand Total using Decimal Arithmetic
        let subtotalDecimal = new Prisma.Decimal(0);

        const orderItemsData = items.map((item) => {
          const product = lockedProductMap.get(item.productId)!;
          const unitPriceDecimal = new Prisma.Decimal(product.unit_price);
          const totalPriceDecimal = unitPriceDecimal.mul(item.quantity);
          subtotalDecimal = subtotalDecimal.add(totalPriceDecimal);

          return {
            organizationId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: unitPriceDecimal,
            totalPrice: totalPriceDecimal,
          };
        });

        // 8.875% tax rate rounded to 2 decimal places
        const TAX_RATE = new Prisma.Decimal('0.08875');
        const taxDecimal = subtotalDecimal.mul(TAX_RATE).toDecimalPlaces(2);
        const grandTotalDecimal = subtotalDecimal.add(taxDecimal);

        const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // 6. Write Order and OrderItem Records
        const newOrder = await tx.order.create({
          data: {
            organizationId,
            orderNumber,
            customerName,
            customerEmail: customerEmail ?? null,
            status: OrderStatus.COMPLETED,
            totalAmount: grandTotalDecimal,
            taxAmount: taxDecimal,
            notes: notes ?? null,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    stockQuantity: true,
                  },
                },
              },
            },
          },
        });

        return newOrder;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 10000,
      }
    );

    return void sendSuccess(
      res,
      {
        ...createdOrder,
        order: createdOrder,
      },
      undefined,
      201,
      'Order successfully placed and inventory deducted.'
    );
  } catch (err: any) {
    if (err instanceof InsufficientStockError) {
      return void sendError(res, err.code, err.message, 409, err.shortages);
    }

    if (err.status && err.message) {
      return void sendError(
        res,
        err.code || 'BAD_REQUEST',
        err.message,
        err.status,
        err.missingProductIds ? { missingProductIds: err.missingProductIds } : undefined
      );
    }

    // Check for PostgreSQL check constraint violation (P2003 or 23514)
    if (err.message && err.message.includes('products_stock_quantity_check')) {
      return void sendError(
        res,
        'INSUFFICIENT_STOCK',
        'Transaction aborted: check constraint prevented negative stock count.',
        409
      );
    }

    console.error('Unhandled checkout error:', err);
    return void sendError(
      res,
      'ORDER_PROCESSING_FAILED',
      'An internal error occurred during checkout processing.',
      500
    );
  }
}

/**
 * GET /api/v1/orders
 * Protected by requireRole(['ADMIN', 'MANAGER', 'CASHIER'])
 * Returns historical order records scoped to the tenant.
 */
export async function getOrdersHandler(req: Request, res: Response): Promise<void> {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return void sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [totalItems, orders] = await Promise.all([
      prisma.order.count({ where: { organizationId } }),
      prisma.order.findMany({
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
        skip,
        take: limit,
      }),
    ]);

    return void sendSuccess(
      res,
      orders,
      {
        page,
        limit,
        total: totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      }
    );
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    return void sendError(
      res,
      'FETCH_ORDERS_FAILED',
      'Failed to retrieve order history.',
      500
    );
  }
}
