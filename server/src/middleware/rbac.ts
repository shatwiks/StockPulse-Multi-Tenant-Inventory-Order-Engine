import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

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
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required before role verification.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `User role '${req.user.role}' is not authorized to perform this action. Required: [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
}
