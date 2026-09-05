// Re-export Prisma Client & Database
export * from '@prisma/client';
export { prisma, default as db } from './db/client';

// Re-export Express API Layer
export { placeOrderHandler, placeOrderSchema, placeOrderItemSchema, InsufficientStockError } from './api/orders.controller';
export { default as apiRouter } from './api/routes';
export { app } from './server';
