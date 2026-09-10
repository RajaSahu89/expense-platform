import { z } from 'zod';

export const transactionSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1).max(200),
  merchant: z.string().max(200).optional().nullable(),
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().nullable().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(30),
  keywords: z.string().max(500).optional().default(''),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1),
  monthlyLimit: z.number().positive(),
  rollover: z.boolean().optional().default(false),
  alertAt: z.number().min(1).max(100).optional().default(80),
});

export const recurringSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().nullable().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const csvMappingSchema = z.object({
  date: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().optional(),
  debit: z.string().optional(),
  credit: z.string().optional(),
});
