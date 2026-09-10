import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = budgetSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const budget = await prisma.budget.update({
    where: { id: params.id },
    data: parsed.data,
    include: { category: true },
  });
  return NextResponse.json({ budget });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.budget.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
