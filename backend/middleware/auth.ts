import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface DemoActor {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: DemoActor;
    }
  }
}

/**
 * SECURITY NOTE:
 * Local/demo role-switching mode without authentication.
 * This is strictly for demonstration and UI/workflow testing — NOT real security.
 * For production multi-user deployment, implement server-side authentication separately.
 */
const DEMO_ACTORS: Record<UserRole, DemoActor> = {
  ADMIN: {
    id: 'demo-admin',
    fullName: 'Rizwan Ahmed',
    email: 'admin@celltrack.pk',
    phone: '+92 300 8451290',
    role: 'ADMIN',
    isActive: true,
  },
  MANAGER: {
    id: 'demo-manager',
    fullName: 'Hamza Tariq',
    email: 'manager@celltrack.pk',
    phone: '+92 321 4490812',
    role: 'MANAGER',
    isActive: true,
  },
  STAFF: {
    id: 'demo-staff',
    fullName: 'Bilal Mahmood',
    email: 'staff@celltrack.pk',
    phone: '+92 333 9023415',
    role: 'STAFF',
    isActive: true,
  },
};

export function parseDemoRole(raw: unknown): UserRole {
  if (typeof raw === 'string') {
    const upper = raw.trim().toUpperCase();
    if (upper === 'ADMIN' || upper === 'MANAGER' || upper === 'STAFF') {
      return upper;
    }
  }
  return 'ADMIN';
}

export function canRoleAccess(userRole: UserRole, allowedRoles: readonly UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canViewSensitiveFinancials(userRole: UserRole): boolean {
  return userRole === 'ADMIN';
}

export function resolveDemoRole(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const headerRole = req.headers['x-demo-role'];
  const role = parseDemoRole(Array.isArray(headerRole) ? headerRole[0] : headerRole);
  req.user = DEMO_ACTORS[role];
  next();
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const actor = req.user || DEMO_ACTORS.ADMIN;
    if (!canRoleAccess(actor.role, allowedRoles)) {
      next(
        new AppError(
          403,
          `Current demo role (${actor.role}) does not have access to this resource.`,
        ),
      );
      return;
    }
    next();
  };
}
