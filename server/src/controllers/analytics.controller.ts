import { Request, Response } from 'express';
import { OrderStatus } from '@prisma/client';
import prisma from '../db/client';
import { sendSuccess, sendError } from '../utils/response';

/**
 * GET /api/v1/analytics
 * Returns aggregated BI analytics, revenue metrics, stock valuation,
 * and category breakdown scoped strictly to the tenant organization.
 * RBAC: ADMIN or MANAGER only.
 */
export async function getAnalyticsHandler(req: Request, res: Response): Promise<Response> {
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return sendError(res, 'UNAUTHORIZED', 'Missing tenant context.', 401);
  }

  try {
    const [orders, products, categories] = await Promise.all([
      prisma.order.findMany({
        where: { organizationId, status: OrderStatus.COMPLETED },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, categoryId: true, unitPrice: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.product.findMany({
        where: { organizationId },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.category.findMany({
        where: { organizationId },
        orderBy: { name: 'asc' },
      }),
    ]);

    // 1. Core Financial & Order Metrics
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalTax = orders.reduce((sum, o) => sum + Number(o.taxAmount), 0);
    const ordersCount = orders.length;
    const avgOrderValue = ordersCount > 0 ? totalRevenue / ordersCount : 0;

    // 2. Inventory Capital & Stock Health Metrics
    const totalProducts = products.length;
    const totalInventoryUnits = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const inventoryValuation = products.reduce(
      (sum, p) => sum + p.stockQuantity * Number(p.unitPrice),
      0
    );
    const lowStockCount = products.filter(
      (p) => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0
    ).length;
    const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;
    const inStockCount = products.filter((p) => p.stockQuantity > p.reorderLevel).length;

    // 3. Top Selling Products
    const productSalesMap = new Map<
      string,
      { id: string; name: string; sku: string; unitsSold: number; revenue: number; currentStock: number }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const prod = item.product;
        const current = productSalesMap.get(item.productId) || {
          id: item.productId,
          name: prod?.name || 'Unknown Item',
          sku: prod?.sku || 'SKU-UNKNOWN',
          unitsSold: 0,
          revenue: 0,
          currentStock: products.find((p) => p.id === item.productId)?.stockQuantity || 0,
        };
        current.unitsSold += item.quantity;
        current.revenue += Number(item.totalPrice);
        productSalesMap.set(item.productId, current);
      }
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Category Capital & Performance Breakdown
    const categoryBreakdown = categories.map((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      const catStockUnits = catProducts.reduce((sum, p) => sum + p.stockQuantity, 0);
      const catValuation = catProducts.reduce(
        (sum, p) => sum + p.stockQuantity * Number(p.unitPrice),
        0
      );

      let catSales = 0;
      for (const order of orders) {
        for (const item of order.items) {
          if (item.product?.categoryId === cat.id) {
            catSales += Number(item.totalPrice);
          }
        }
      }

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: catProducts.length,
        stockUnits: catStockUnits,
        valuation: Number(catValuation.toFixed(2)),
        salesRevenue: Number(catSales.toFixed(2)),
        salesContribution:
          totalRevenue > 0 ? Number(((catSales / totalRevenue) * 100).toFixed(1)) : 0,
      };
    });

    // 5. Daily Sales Trend (Recent 14 Days)
    const trendMap = new Map<string, { date: string; revenue: number; orders: number }>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      trendMap.set(key, { date: key, revenue: 0, orders: 0 });
    }

    for (const order of orders) {
      const key = new Date(order.createdAt).toISOString().split('T')[0];
      const entry = trendMap.get(key);
      if (entry) {
        entry.revenue += Number(order.totalAmount);
        entry.orders += 1;
      }
    }

    const salesTrend = Array.from(trendMap.values()).map((t) => ({
      ...t,
      revenue: Number(t.revenue.toFixed(2)),
    }));

    return sendSuccess(res, {
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        ordersCount,
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        currency: 'INR',
        currencySymbol: '₹',
        taxRate: '18% GST',
      },
      inventoryHealth: {
        totalProducts,
        totalInventoryUnits,
        inventoryValuation: Number(inventoryValuation.toFixed(2)),
        inStockCount,
        lowStockCount,
        outOfStockCount,
        healthScore:
          totalProducts > 0
            ? Math.round(((totalProducts - outOfStockCount - lowStockCount * 0.5) / totalProducts) * 100)
            : 100,
      },
      topSellingProducts,
      categoryBreakdown,
      salesTrend,
    });
  } catch (err: any) {
    console.error('Error computing analytics:', err);
    return sendError(res, 'FETCH_ANALYTICS_FAILED', err.message || 'Internal server error', 500);
  }
}
