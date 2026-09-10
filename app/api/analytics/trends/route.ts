import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const months = Math.min(parseInt(searchParams.get('months') ?? '6', 10), 24);

  const now = new Date();
  const series = [];

  for (let i = months - 1; i >= 0; i--) {
    const ref = subMonths(now, i);
    const monthStart = startOfMonth(ref);
    const monthEnd = endOfMonth(ref);

    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
    ]);

    series.push({
      month: format(monthStart, 'MMM yyyy'),
      income: income._sum.amount ?? 0,
      expense: expense._sum.amount ?? 0,
      net: (income._sum.amount ?? 0) - (expense._sum.amount ?? 0),
    });
  }

  return NextResponse.json({ series });
}
