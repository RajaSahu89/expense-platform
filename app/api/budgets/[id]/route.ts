import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { budgetSchema } from '@/lib/validation';
import { route } from '@/lib/http';
import { refreshAlerts } from '@/lib/alerts';

type Ctx = { params: { id: string } };

export const PATCH = route(async (req: NextRequest, { params }: Ctx) => {
  const body = await req.json();
  const parsed = budgetSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const budget = await prisma.budget.update({
    where: { id: params.id },
    data: parsed.data,
    include: { category: true },
  });
  await refreshAlerts();
  return NextResponse.json({ budget });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  await prisma.budget.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
});
