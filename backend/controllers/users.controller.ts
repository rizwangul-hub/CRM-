import type { Request, Response, NextFunction } from 'express';
import { createUserSchema, updateUserSchema } from '../validators/auth.validator';
import {
  createStaffUser,
  deleteStaffUser,
  listUsers,
  updateStaffUser,
} from '../services/auth.service';

export async function handleListUsers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listUsers({
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      role: typeof req.query.role === 'string' ? req.query.role : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = createUserSchema.parse(req.body);
    const created = await createStaffUser(req.user!, parsed, req.ip);
    res.status(201).json({
      success: true,
      message: `Team member ${created.fullName} added.`,
      data: { user: created },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateUserSchema.parse(req.body);
    const updated = await updateStaffUser(req.user!, String(req.params.id), parsed, req.ip);
    res.status(200).json({
      success: true,
      message: `Updated ${updated.fullName}.`,
      data: { user: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteStaffUser(req.user!, String(req.params.id), req.ip);
    res.status(200).json({
      success: true,
      message: 'Team member removed.',
    });
  } catch (err) {
    next(err);
  }
}
