import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month'); // YYYY-MM
  const reference = monthParam ? new Date(`${monthParam}-01`) : new Date();
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);

  const [income, expense, byCategory, recentTransactions] = await Promise.all([
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
      orderBy: { date: 'desc' },
      take: 8,
      include: { category: true },
    }),
  ]);

  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const breakdown = byCategory.map((row) => ({
    categoryId: row.categoryId,
    categoryName: row.categoryId ? categoryMap.get(row.categoryId)?.name ?? 'Uncategorized' : 'Uncategorized',
    color: row.categoryId ? categoryMap.get(row.categoryId)?.color ?? '#8B98B8' : '#8B98B8',
    amount: row._sum.amount ?? 0,
  }));

  return NextResponse.json({
    month: monthStart.toISOString().slice(0, 7),
    totalIncome: income._sum.amount ?? 0,
    totalExpense: expense._sum.amount ?? 0,
    net: (income._sum.amount ?? 0) - (expense._sum.amount ?? 0),
    breakdown,
    recentTransactions,
  });
}
