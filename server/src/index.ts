// Re-export Prisma Client & Database
export * from '@prisma/client';
export { prisma, default as db } from './db/client';

// Re-export Express API Layer
export { placeOrderHandler, placeOrderSchema, placeOrderItemSchema, InsufficientStockError } from './api/orders.controller';
export { default as apiRouter } from './api/routes';
export { app } from './server';

// Re-export Frontend React Components & Types
export { InventoryTable } from './components/InventoryTable';
export type { Product, ProductCategory, ProductsResponse, InventoryTableProps } from './components/InventoryTable';
export { StockPulseQueryProvider } from './components/QueryProvider';
export { InventoryDataTable } from './components/InventoryDataTable';
export { InventoryPage } from './components/InventoryPage';
export { AddProductDialog } from './components/AddProductDialog';
export { StockAdjustModal } from './components/StockAdjustModal';
export type {
  CategoryOption,
  InventoryProduct,
  NewProductFormData,
  StockFilterType,
} from './components/types';
export * from './components/mockData';

