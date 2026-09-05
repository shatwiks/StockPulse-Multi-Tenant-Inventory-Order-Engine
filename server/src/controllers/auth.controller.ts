import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '../db/client';
import { generateToken } from '../middleware/auth';
import { sendError } from '../utils/response';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Valid email is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  organizationId: z.string().uuid().optional(),
});

/**
 * POST /api/v1/auth/login
 * Enterprise credentials authentication with bcrypt verification and JWT generation.
 */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return void sendError(
      res,
      'VALIDATION_ERROR',
      'Invalid login parameters.',
      400,
      parseResult.error.flatten().fieldErrors
    );
  }

  const { email, password, organizationId } = parseResult.data;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return void sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return void sendError(res, 'USER_INACTIVE', 'This user account has been deactivated.', 403);
    }

    if (user.organization.status !== 'ACTIVE') {
      return void sendError(
        res,
        'ORGANIZATION_INACTIVE',
        'The associated organization is currently suspended or inactive.',
        403
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return void sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const token = generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      ...(user.firstName ? { firstName: user.firstName } : {}),
      ...(user.lastName ? { lastName: user.lastName } : {}),
    });

    const authPayload = {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
        organizationSlug: user.organization.slug,
      },
    };

    res.status(200).json({
      success: true,
      data: authPayload,
      token,
      user: authPayload.user,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return void sendError(
      res,
      'INTERNAL_SERVER_ERROR',
      'Authentication failed due to an unexpected server error.',
      500
    );
  }
}
