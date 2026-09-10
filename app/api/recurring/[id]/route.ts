import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recurringSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = recurringSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: any = { ...parsed.data };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const recurring = await prisma.recurringExpense.update({
    where: { id: params.id },
    data,
    include: { category: true },
  });
  return NextResponse.json({ recurring });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.recurringExpense.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
