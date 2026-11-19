import { User, type IUser } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import type { UserRole } from '../middleware/auth';
import { recordAuditLog } from './audit.service';
import type { CreateUserInput, UpdateUserInput } from '../validators/auth.validator';

export interface SafeUserDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function serializeUser(
  user: Pick<
    IUser,
    '_id' | 'fullName' | 'email' | 'phone' | 'role' | 'isActive' | 'lastLoginAt' | 'createdAt'
  >,
): SafeUserDTO {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    createdAt: new Date(user.createdAt).toISOString(),
  };
}

export async function listUsers(params: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const query: Record<string, unknown> = {};

  if (params.role && ['ADMIN', 'MANAGER', 'STAFF'].includes(params.role)) {
    query.role = params.role;
  }

  if (params.search && params.search.trim()) {
    const regex = new RegExp(params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    items: users.map(serializeUser),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function createStaffUser(
  actor: { id: string; fullName: string; role: UserRole },
  input: CreateUserInput,
  ipAddress?: string,
): Promise<SafeUserDTO> {
  const existing = await User.findOne({ email: input.email.toLowerCase() }).lean();
  if (existing) {
    throw new AppError(409, 'A team member with this email already exists.', {
      email: 'This email address is already registered.',
    });
  }

  const created = await User.create({
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    phone: input.phone || '',
    role: input.role,
    isActive: true,
  });

  await recordAuditLog({
    actorName: actor.fullName,
    actorRole: actor.role,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: created._id.toString(),
    summary: `Added ${created.role} profile for ${created.fullName} (${created.email})`,
    ipAddress,
  });

  return serializeUser(created);
}

export async function updateStaffUser(
  actor: { id: string; fullName: string; role: UserRole },
  targetUserId: string,
  input: UpdateUserInput,
  ipAddress?: string,
): Promise<SafeUserDTO> {
  const target = await User.findById(targetUserId);
  if (!target) {
    throw new AppError(404, 'Team member not found.');
  }

  if (
    target.role === 'ADMIN' &&
    (input.isActive === false || (input.role && input.role !== 'ADMIN'))
  ) {
    const activeAdmins = await User.countDocuments({ role: 'ADMIN', isActive: true });
    if (activeAdmins <= 1) {
      throw new AppError(400, 'At least one active administrator must remain in the system.');
    }
  }

  if (input.fullName !== undefined) target.fullName = input.fullName;
  if (input.phone !== undefined) target.phone = input.phone;
  if (input.role !== undefined) target.role = input.role;
  if (input.isActive !== undefined) target.isActive = input.isActive;

  await target.save();

  await recordAuditLog({
    actorName: actor.fullName,
    actorRole: actor.role,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: target._id.toString(),
    summary: `Updated profile ${target.fullName} (${target.role}, active: ${target.isActive})`,
    ipAddress,
  });

  return serializeUser(target);
}

export async function deleteStaffUser(
  actor: { id: string; fullName: string; role: UserRole },
  targetUserId: string,
  ipAddress?: string,
): Promise<void> {
  const target = await User.findById(targetUserId);
  if (!target) {
    throw new AppError(404, 'Team member not found.');
  }

  if (target.role === 'ADMIN') {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount <= 1) {
      throw new AppError(400, 'Cannot delete the sole administrator profile.');
    }
  }

  await User.findByIdAndDelete(targetUserId);

  await recordAuditLog({
    actorName: actor.fullName,
    actorRole: actor.role,
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: targetUserId,
    summary: `Removed ${target.role} profile for ${target.fullName} (${target.email})`,
    ipAddress,
  });
}
