import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { sendError } from '../utils/response';

/**
 * Factory creating an RBAC middleware that enforces the Principle of Least Privilege.
 *
 * RBAC Rules:
 * - CASHIER: Can view inventory (`GET /products`), view orders, and place checkout orders (`POST /orders`).
 *            Cannot modify prices, delete items, or adjust physical stock.
 * - MANAGER: Full inventory CRUD, price adjustments, stock reconciliation, and order management.
 * - ADMIN: Unrestricted access across all tenant entities, configurations, and administrative actions.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return void sendError(
        res,
        'UNAUTHORIZED',
        'Authentication required before role verification.',
        401
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return void sendError(
        res,
        'FORBIDDEN',
        `User role '${req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(', ')}].`,
        403
      );
    }

    next();
  };
}
