import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/http';
import { startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

const FALLBACK_COLOR = '#A3A9B1';

export const GET = route(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');
  let reference = new Date();
  if (monthParam) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
      return NextResponse.json({ error: 'month must be YYYY-MM' }, { status: 400 });
    }
    reference = new Date(`${monthParam}-15T12:00:00`);
  }
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);

  const [income, expense, byCategory, recentTransactions, categories] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    prisma.transaction.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 8,
      include: { category: true },
    }),
    prisma.category.findMany(),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const breakdown = byCategory.map((row) => {
    const cat = row.categoryId ? categoryMap.get(row.categoryId) : undefined;
    return {
      categoryId: row.categoryId,
      categoryName: cat?.name ?? 'Uncategorized',
      color: cat?.color ?? FALLBACK_COLOR,
      amount: row._sum.amount ?? 0,
    };
  });

  const totalIncome = income._sum.amount ?? 0;
  const totalExpense = expense._sum.amount ?? 0;

  return NextResponse.json({
    
    month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    breakdown,
    recentTransactions,
  });
});
