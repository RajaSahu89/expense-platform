import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recurringSchema } from '@/lib/validation';
import { route } from '@/lib/http';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const recurring = await prisma.recurringExpense.findMany({
    include: { category: true },
    orderBy: { nextRunDate: 'asc' },
  });
  return NextResponse.json({ recurring });
});

export const POST = route(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = recurringSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const startDate = new Date(parsed.data.startDate);
  const endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
  if (endDate && endDate < startDate) {
    return NextResponse.json({ error: 'End date must be after the start date' }, { status: 400 });
  }

  const recurring = await prisma.recurringExpense.create({
    data: {
      ...parsed.data,
      startDate,
      endDate,
      nextRunDate: startDate,
    },
    include: { category: true },
  });

  return NextResponse.json({ recurring }, { status: 201 });
});
