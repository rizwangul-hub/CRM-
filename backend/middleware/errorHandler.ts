import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class AppError extends Error {
  statusCode: number;
  details?: Record<string, string>;

  constructor(statusCode: number, message: string, details?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export function notFoundApiHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'form';
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    res.status(400).json({
      success: false,
      message: 'Validation failed. Please check the highlighted fields.',
      errors: fieldErrors,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid identifier provided for ${err.path}.`,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const fieldErrors: Record<string, string> = {};
    for (const [key, val] of Object.entries(err.errors)) {
      fieldErrors[key] = val.message;
    }
    res.status(400).json({
      success: false,
      message: 'Database validation failed.',
      errors: fieldErrors,
    });
    return;
  }

  const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
  if (mongoErr && mongoErr.code === 11000) {
    const duplicateField = Object.keys(mongoErr.keyPattern || {})[0] || 'record';
    res.status(409).json({
      success: false,
      message: `A record with this ${duplicateField} already exists.`,
      errors: { [duplicateField]: `This ${duplicateField} is already in use.` },
    });
    return;
  }

  console.error('[API Error]', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred. Please try again.',
  });
}
