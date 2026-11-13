import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { refreshAlerts } from '@/lib/alerts';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');
  const type = searchParams.get('type');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const q = searchParams.get('q')?.trim();
  const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') ?? '25', 10) || 25, 1), 100);

  const where: Prisma.TransactionWhereInput = {};
  if (categoryId === 'none') where.categoryId = null;
  else if (categoryId) where.categoryId = categoryId;
  if (type === 'INCOME' || type === 'EXPENSE') where.type = type;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setUTCHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }
  if (q) {
    where.OR = [
      { description: { contains: q, mode: 'insensitive' } },
      { merchant: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, page, pageSize });
});

export const POST = route(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      source: 'manual',
    },
    include: { category: true },
  });

  await refreshAlerts();

  return NextResponse.json({ transaction }, { status: 201 });
});
