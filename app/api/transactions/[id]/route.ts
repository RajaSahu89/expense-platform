import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { refreshAlerts } from '@/lib/alerts';
import { route } from '@/lib/http';

type Ctx = { params: { id: string } };

export const GET = route(async (_req: NextRequest, { params }: Ctx) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: { category: true },
  });
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ transaction });
});

export const PATCH = route(async (req: NextRequest, { params }: Ctx) => {
  const body = await req.json();
  const parsed = transactionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { date, ...rest } = parsed.data;
  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    include: { category: true },
  });

  await refreshAlerts();

  return NextResponse.json({ transaction });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  await prisma.transaction.delete({ where: { id: params.id } });
  await refreshAlerts();
  return NextResponse.json({ success: true });
});
