import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validation';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const budgets = await prisma.budget.findMany({ include: { category: true } });

  const spend = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });
  const spendMap = new Map(spend.map((s) => [s.categoryId, s._sum.amount ?? 0]));

  const withProgress = budgets.map((b) => {
    const spent = spendMap.get(b.categoryId) ?? 0;
    return {
      ...b,
      spent,
      remaining: Math.max(b.monthlyLimit - spent, 0),
      percentUsed: b.monthlyLimit > 0 ? Math.min((spent / b.monthlyLimit) * 100, 999) : 0,
    };
  });

  return NextResponse.json({ budgets: withProgress });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.budget.findUnique({ where: { categoryId: parsed.data.categoryId } });
  if (existing) {
    return NextResponse.json({ error: 'A budget already exists for this category' }, { status: 409 });
  }

  const budget = await prisma.budget.create({ data: parsed.data, include: { category: true } });
  return NextResponse.json({ budget }, { status: 201 });
}
