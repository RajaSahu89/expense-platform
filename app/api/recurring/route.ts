import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recurringSchema } from '@/lib/validation';

export async function GET() {
  const recurring = await prisma.recurringExpense.findMany({
    include: { category: true },
    orderBy: { nextRunDate: 'asc' },
  });
  return NextResponse.json({ recurring });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = recurringSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const startDate = new Date(parsed.data.startDate);

  const recurring = await prisma.recurringExpense.create({
    data: {
      ...parsed.data,
      startDate,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      nextRunDate: startDate,
    },
    include: { category: true },
  });

  return NextResponse.json({ recurring }, { status: 201 });
}
