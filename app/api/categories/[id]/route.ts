import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validation';
import { route } from '@/lib/http';

type Ctx = { params: { id: string } };

export const PATCH = route(async (req: NextRequest, { params }: Ctx) => {
  const body = await req.json();
  const parsed = categorySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }
  const category = await prisma.category.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ category });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (category.isSystem) {
    return NextResponse.json({ error: 'System categories cannot be deleted' }, { status: 400 });
  }
  // Transactions/recurring items become uncategorized (onDelete: SetNull) and
  // the category's budget is removed (onDelete: Cascade) — see schema.prisma.
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
});
