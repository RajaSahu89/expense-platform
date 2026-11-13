import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recurringSchema } from '@/lib/validation';
import { route } from '@/lib/http';
import { nextOccurrenceOnOrAfter } from '@/lib/recurring';

type Ctx = { params: { id: string } };

export const PATCH = route(async (req: NextRequest, { params }: Ctx) => {
  const body = await req.json();
  const parsed = recurringSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.recurringExpense.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { startDate, endDate, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };

  if (startDate) {
    data.startDate = new Date(startDate);
    // Not run yet → the schedule should start from the new date.
    if (!existing.lastRunDate) data.nextRunDate = new Date(startDate);
  }
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null; // null clears it

  // Resuming a paused item: don't backfill every occurrence missed while it
  // was paused — jump to the next upcoming one.
  if (parsed.data.isActive === true && !existing.isActive) {
    const base = (data.nextRunDate as Date | undefined) ?? existing.nextRunDate;
    const freq = parsed.data.frequency ?? existing.frequency;
    data.nextRunDate = nextOccurrenceOnOrAfter(base, freq, new Date());
  }

  const recurring = await prisma.recurringExpense.update({
    where: { id: params.id },
    data,
    include: { category: true },
  });
  return NextResponse.json({ recurring });
});

export const DELETE = route(async (_req: NextRequest, { params }: Ctx) => {
  // Generated transactions are kept (recurringId is set to NULL).
  await prisma.recurringExpense.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
});
