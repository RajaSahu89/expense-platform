import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route } from '@/lib/http';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export const GET = route(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const months = Math.min(Math.max(parseInt(searchParams.get('months') ?? '6', 10) || 6, 1), 24);

  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, months - 1));
  const rangeEnd = endOfMonth(now);

  const txs = await prisma.transaction.findMany({
    where: { date: { gte: rangeStart, lte: rangeEnd } },
    select: { date: true, amount: true, type: true },
  });

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = months - 1; i >= 0; i--) {
    buckets.set(format(subMonths(now, i), 'yyyy-MM'), { income: 0, expense: 0 });
  }
  for (const t of txs) {
    const bucket = buckets.get(format(t.date, 'yyyy-MM'));
    if (!bucket) continue;
    if (t.type === 'INCOME') bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  const series = Array.from(buckets.entries()).map(([key, v]) => ({
    month: format(new Date(`${key}-15T12:00:00`), 'MMM yyyy'),
    income: v.income,
    expense: v.expense,
    net: v.income - v.expense,
  }));

  return NextResponse.json({ series });
});
