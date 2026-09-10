import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { transactionSchema } from '@/lib/validation';
import { refreshAlerts } from '@/lib/alerts';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: { category: true },
  });
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ transaction });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = transactionSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: any = { ...parsed.data };
  if (data.date) data.date = new Date(data.date);

  const transaction = await prisma.transaction.update({
    where: { id: params.id },
    data,
    include: { category: true },
  });

  await refreshAlerts();

  return NextResponse.json({ transaction });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.transaction.delete({ where: { id: params.id } });
  await refreshAlerts();
  return NextResponse.json({ success: true });
}
