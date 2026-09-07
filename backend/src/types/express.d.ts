import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
