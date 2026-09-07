import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../types/express';
import { sendError } from '../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'enterprise-grade-stockpulse-jwt-secret-key-replace-in-production';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

/**
 * Generates a signed JWT token containing tenant context and user role.
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies the incoming Bearer token or HTTP-only cookie, extracting
 * userId, organizationId, and role to enforce multi-tenant isolation.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if ((req as any).cookies && (req as any).cookies.token) {
    token = (req as any).cookies.token;
  }

  if (!token) {
    return void sendError(
      res,
      'UNAUTHORIZED',
      'Authentication required. Missing Bearer token in Authorization header or cookie.',
      401
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (!decoded.userId || !decoded.organizationId || !decoded.role) {
      return void sendError(
        res,
        'INVALID_TOKEN_PAYLOAD',
        'Token payload is missing required tenant claims (userId, organizationId, role).',
        401
      );
    }

    // UUID format check on organizationId to prevent injection attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(decoded.organizationId)) {
      return void sendError(
        res,
        'INVALID_TENANT_ID',
        'Invalid organizationId format in token claims.',
        403
      );
    }

    req.user = {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      email: decoded.email,
      role: decoded.role,
      ...(decoded.firstName ? { firstName: decoded.firstName } : {}),
      ...(decoded.lastName ? { lastName: decoded.lastName } : {}),
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return void sendError(
        res,
        'TOKEN_EXPIRED',
        'Authentication token has expired. Please re-authenticate.',
        401
      );
    }

    return void sendError(
      res,
      'INVALID_TOKEN',
      'Authentication token signature verification failed.',
      401
    );
  }
}
