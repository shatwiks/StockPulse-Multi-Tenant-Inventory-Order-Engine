import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '../db/client';
import { generateToken } from '../middleware/auth';

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
    res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid login parameters.',
      errors: parseResult.error.flatten().fieldErrors,
    });
    return;
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
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'USER_INACTIVE',
        message: 'This user account has been deactivated.',
      });
      return;
    }

    if (user.organization.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'ORGANIZATION_INACTIVE',
        message: 'The associated organization is currently suspended or inactive.',
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      ...(user.firstName ? { firstName: user.firstName } : {}),
      ...(user.lastName ? { lastName: user.lastName } : {}),
    });

    res.json({
      success: true,
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
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Authentication failed due to an unexpected server error.',
    });
  }
}
