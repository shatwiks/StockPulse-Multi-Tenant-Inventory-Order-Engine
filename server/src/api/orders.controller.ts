import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma, OrderStatus } from '@prisma/client';
import prisma from '../db/client';

// ============================================================================
// 1. Zod Request Validation Schemas
// ============================================================================

export const placeOrderItemSchema = z.object({
  productId: z.string().uuid({ message: 'Invalid productId format. Must be a valid UUID.' }),
  quantity: z
    .number()
    .int({ message: 'Quantity must be an integer.' })
    .positive({ message: 'Quantity must be strictly greater than 0.' }),
});

export const placeOrderSchema = z.object({
  organizationId: z.string().uuid({ message: 'Invalid organizationId format. Must be a valid UUID.' }),
  customerName: z
    .string()
    .min(1, { message: 'Customer name is required.' })
    .max(255, { message: 'Customer name cannot exceed 255 characters.' }),
  customerEmail: z
    .string()
    .email({ message: 'Customer email must be a valid email address.' })
    .max(255, { message: 'Customer email cannot exceed 255 characters.' }),
  notes: z.string().max(1000).optional(),
  items: z
    .array(placeOrderItemSchema)
    .min(1, { message: 'Order must contain at least one item.' }),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

// Custom Insufficient Stock Error
export class InsufficientStockError extends Error {
  public readonly statusCode = 409;
  public readonly code = 'INSUFFICIENT_STOCK';
  public readonly details: {
    productId: string;
    sku: string;
    name: string;
    availableStock: number;
    requestedQuantity: number;
  };

  constructor(details: {
    productId: string;
    sku: string;
    name: string;
    availableStock: number;
    requestedQuantity: number;
  }) {
    super(
      `Insufficient stock for product '${details.name}' (SKU: ${details.sku}). Requested: ${details.requestedQuantity}, Available: ${details.availableStock}`
    );
    this.name = 'InsufficientStockError';
    this.details = details;
  }
}

// ============================================================================
// 2. Concurrency-Safe Transactional Order Placement Handler
// ============================================================================

export async function placeOrderHandler(req: Request, res: Response): Promise<Response> {
  // A. Input Validation
  const parseResult = placeOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid order placement request payload.',
      issues: parseResult.error.flatten().fieldErrors,
    });
  }

  const { organizationId, customerName, customerEmail, notes, items } = parseResult.data;

  // Aggregate quantities if duplicate product IDs were submitted in the same order
  const quantityByProduct = new Map<string, number>();
  for (const item of items) {
    const current = quantityByProduct.get(item.productId) ?? 0;
    quantityByProduct.set(item.productId, current + item.quantity);
  }

  // DEADLOCK PREVENTION:
  // Sort product IDs deterministically (ascending string order) before locking rows.
  // This ensures concurrent transactions acquire row locks in identical sequence.
  const sortedProductIds = Array.from(quantityByProduct.keys()).sort();

  try {
    // B. Explicit PostgreSQL Database Transaction with Row-Level Locking
    const createdOrder = await prisma.$transaction(
      async (tx) => {
        // 1. Verify tenant organization exists
        const org = await tx.organization.findUnique({
          where: { id: organizationId },
          select: { id: true, name: true, currency: true, status: true },
        });

        if (!org) {
          throw { status: 404, message: `Organization with ID '${organizationId}' was not found.` };
        }

        if (org.status !== 'ACTIVE') {
          throw { status: 403, message: `Organization '${org.name}' is not active (${org.status}).` };
        }

        // 2. SELECT ... FOR UPDATE (Row-Level Lock)
        // Locks the rows for all target products in this tenant, preventing concurrent
        // checkouts from reading or modifying stale stock balances until this transaction commits/rolls back.
        const lockedProducts = await tx.$queryRaw<
          Array<{
            id: string;
            organization_id: string;
            name: string;
            sku: string;
            unit_price: string | number;
            cost_price: string | number;
            stock_quantity: number;
            status: string;
          }>
        >`
          SELECT id, organization_id, name, sku, unit_price, cost_price, stock_quantity, status
          FROM products
          WHERE id = ANY(${sortedProductIds}::uuid[]) 
            AND organization_id = ${organizationId}::uuid
          ORDER BY id ASC
          FOR UPDATE;
        `;

        // 3. Verify all requested products exist within this tenant
        const lockedProductMap = new Map(lockedProducts.map((p) => [p.id, p]));

        for (const productId of sortedProductIds) {
          if (!lockedProductMap.has(productId)) {
            throw {
              status: 404,
              message: `Product ID '${productId}' was not found in organization '${organizationId}'.`,
            };
          }
        }

        // 4. Stock Sufficiency Check
        // If any item has insufficient stock, roll back the transaction entirely
        for (const [productId, requestedQty] of quantityByProduct.entries()) {
          const product = lockedProductMap.get(productId)!;

          if (product.status !== 'ACTIVE') {
            throw {
              status: 400,
              message: `Product '${product.name}' (SKU: ${product.sku}) is currently not available for purchase (status: ${product.status}).`,
            };
          }

          if (product.stock_quantity < requestedQty) {
            // Throwing InsufficientStockError inside $transaction automatically triggers ROLLBACK
            throw new InsufficientStockError({
              productId: product.id,
              sku: product.sku,
              name: product.name,
              availableStock: product.stock_quantity,
              requestedQuantity: requestedQty,
            });
          }
        }

        // 5. Deduct Inventory Counts
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

        // 6. Calculate Order Totals and Prepare Order Items
        const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        let calculatedTotal = new Prisma.Decimal(0);

        const orderItemsData = items.map((item) => {
          const product = lockedProductMap.get(item.productId)!;
          const unitPriceDecimal = new Prisma.Decimal(product.unit_price);
          const totalPriceDecimal = unitPriceDecimal.mul(item.quantity);
          calculatedTotal = calculatedTotal.add(totalPriceDecimal);

          return {
            organizationId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: unitPriceDecimal,
            totalPrice: totalPriceDecimal,
          };
        });

        // 7. Calculate Grand Total with Tax and Generate Orders Records
        const taxAmountDecimal = calculatedTotal.mul(0.08875).toDecimalPlaces(2);
        const grandTotalDecimal = calculatedTotal.add(taxAmountDecimal);

        const newOrder = await tx.order.create({
          data: {
            organizationId,
            orderNumber,
            customerName,
            customerEmail: customerEmail ?? null,
            status: OrderStatus.COMPLETED,
            totalAmount: grandTotalDecimal,
            taxAmount: taxAmountDecimal,
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
                    stockQuantity: true, // will reflect updated stock after transaction commits
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
        maxWait: 5000, // 5s max wait to acquire transaction slot
        timeout: 10000, // 10s max transaction duration
      }
    );

    // Return created order
    return res.status(201).json({
      success: true,
      message: 'Order successfully placed with atomic inventory deduction.',
      data: createdOrder,
    });
  } catch (err: any) {
    // Check if error is InsufficientStockError -> Return 409 Conflict with details
    if (err instanceof InsufficientStockError || err.name === 'InsufficientStockError') {
      return res.status(409).json({
        error: err.code || 'INSUFFICIENT_STOCK',
        message: err.message,
        details: err.details,
      });
    }

    // Check if custom status error
    if (err.status && typeof err.status === 'number') {
      return res.status(err.status).json({
        error: 'ORDER_CREATION_FAILED',
        message: err.message,
      });
    }

    // PostgreSQL Check constraint violation fallback (in case concurrent bypass occurred)
    if (err.message && (err.message.includes('products_stock_quantity_check') || err.message.includes('23514'))) {
      return res.status(409).json({
        error: 'INSUFFICIENT_STOCK_CHECK_CONSTRAINT',
        message: 'Order aborted: database check constraint prevented negative stock count.',
      });
    }

    console.error('Unhandled checkout error:', err);
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred during order processing. The transaction was rolled back.',
    });
  }
}
