import { RecurrenceFrequency } from '@prisma/client';
import { prisma } from './prisma';

/** Advances a date forward by one occurrence of the given frequency. */
export function advanceDate(date: Date, frequency: RecurrenceFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + 1);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'BIWEEKLY':
      next.setDate(next.getDate() + 14);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/**
 * Generates transactions for every recurring expense whose `nextRunDate`
 * has arrived. Safe to call repeatedly (e.g. from a daily cron/queue job
 * or a manual "Run now" button) — each run only creates transactions for
 * occurrences that are actually due, and immediately advances
 * `nextRunDate` past them, so calling it twice in a row is a no-op.
 */
export async function generateDueRecurringTransactions(asOf: Date = new Date()) {
  const due = await prisma.recurringExpense.findMany({
    where: { isActive: true, nextRunDate: { lte: asOf } },
  });

  const created = [];

  for (const item of due) {
    let cursor = item.nextRunDate;

    // Catch up on every missed occurrence, not just the latest one, so a
    // recurring bill that wasn't run for a while backfills correctly.
    while (cursor <= asOf && (!item.endDate || cursor <= item.endDate)) {
      const tx = await prisma.transaction.create({
        data: {
          date: cursor,
          description: item.name,
          amount: item.amount,
          type: item.type,
          categoryId: item.categoryId,
          recurringId: item.id,
          source: 'recurring',
        },
      });
      created.push(tx);
      cursor = advanceDate(cursor, item.frequency);
    }

    await prisma.recurringExpense.update({
      where: { id: item.id },
      data: {
        nextRunDate: cursor,
        lastRunDate: asOf,
        isActive: item.endDate ? cursor <= item.endDate : true,
      },
    });
  }

  return created;
}
