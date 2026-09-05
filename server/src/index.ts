// Re-export Prisma Client & Database
export * from '@prisma/client';
export { prisma, default as db } from './db/client';

// Re-export Express API Layer & Controllers
export { placeOrderHandler, getOrdersHandler, placeOrderSchema, placeOrderItemSchema, InsufficientStockError } from './controllers/order.controller';
export { getProductsHandler, createProductHandler, updateProductHandler, adjustStockHandler, deleteProductHandler, createProductSchema, updateProductSchema, adjustStockSchema } from './controllers/product.controller';
export { loginHandler, loginSchema } from './controllers/auth.controller';
export { authenticateToken, generateToken } from './middleware/auth';
export { requireRole } from './middleware/rbac';
export { default as apiRouter } from './api/routes';
export { app } from './server';

