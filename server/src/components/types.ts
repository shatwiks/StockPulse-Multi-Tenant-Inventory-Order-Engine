import { ProductStatus } from '@prisma/client';
export { ProductStatus };

export type StockFilterType = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface InventoryProduct {
  id: string;
  organizationId: string;
  categoryId?: string;
  categoryName?: string;
  sku: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderPoint: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewProductFormData {
  sku: string;
  name: string;
  categoryId: string;
  unitPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderPoint: number;
  status: ProductStatus;
  description?: string;
}
