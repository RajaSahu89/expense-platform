import { z } from 'zod';

const dateString = z
  .string()
  .min(1)
  .refine((v) => !Number.isNaN(new Date(v).getTime()), { message: 'Invalid date' });

export const transactionSchema = z.object({
  date: dateString,
  description: z.string().trim().min(1).max(200),
  merchant: z.string().max(200).optional().nullable(),
  amount: z.number().positive().finite(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().nullable().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

// NOTE: no `.default()` below. These schemas are reused with `.partial()` for
// PATCH requests, and a default would silently reset untouched fields
// (e.g. editing a budget's limit used to reset its alert threshold to 80).
// Database defaults in schema.prisma cover the create case.
export const categorySchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(30),
  keywords: z.string().max(500).optional(),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  monthlyLimit: z.number().positive().finite(),
  rollover: z.boolean().optional(),
  alertAt: z.number().int().min(1).max(100).optional(),
});

export const recurringSchema = z.object({
  name: z.string().trim().min(1).max(100),
  amount: z.number().positive().finite(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().nullable().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: dateString,
  endDate: dateString.nullable().optional(),
  notes: z.string().max(1000).optional().nullable(),
  // Used by the pause / resume toggle. It was missing before, so Zod
  // stripped it and pausing a recurring item silently did nothing.
  isActive: z.boolean().optional(),
});

export const csvMappingSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().optional(),
  debit: z.string().optional(),
  credit: z.string().optional(),
});
