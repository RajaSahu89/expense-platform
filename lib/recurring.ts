import { RecurrenceFrequency } from '@prisma/client';
import { prisma } from './prisma';
export function advanceDate(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'DAILY':
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case 'WEEKLY':
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case 'MONTHLY': {
      const day = next.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + 1);
      const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(day, lastDay));
      break;
    }
    case 'YEARLY': {
      const day = next.getUTCDate();
      const month = next.getUTCMonth();
      next.setUTCDate(1);
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      const lastDay = new Date(Date.UTC(next.getUTCFullYear(), month + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(day, lastDay));
      break;
    }
  }
  return next;
}
export function nextOccurrenceOnOrAfter(from: Date, frequency: RecurrenceFrequency, asOf: Date): Date {
  let cursor = new Date(from);
  let guard = 0;
  while (cursor < asOf && guard++ < 5000) cursor = advanceDate(cursor, frequency);
  return cursor;
}
export async function generateDueRecurringTransactions(asOf: Date = new Date()) {
  const due = await prisma.recurringExpense.findMany({
    where: { isActive: true, nextRunDate: { lte: asOf } },
  });

  const created = [];

  for (const item of due) {
    const dates: Date[] = [];
    let cursor = item.nextRunDate;
    while (cursor <= asOf && (!item.endDate || cursor <= item.endDate) && dates.length < 1000) {
      dates.push(cursor);
      cursor = advanceDate(cursor, item.frequency);
    }

    const stillActive = item.endDate ? cursor <= item.endDate : true;

    const claimed = await prisma.recurringExpense.updateMany({
      where: { id: item.id, nextRunDate: item.nextRunDate },
      data: { nextRunDate: cursor, lastRunDate: asOf, isActive: stillActive },
    });
    if (claimed.count === 0) continue;

    for (const date of dates) {
      const tx = await prisma.transaction.create({
        data: {
          date,
          description: item.name,
          amount: item.amount,
          type: item.type,
          categoryId: item.categoryId,
          recurringId: item.id,
          source: 'recurring',
        },
      });
      created.push(tx);
    }
  }

  return created;
}
