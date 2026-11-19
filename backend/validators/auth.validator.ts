import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Full name is too long'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number is too long')
    .optional()
    .or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(120).optional(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
