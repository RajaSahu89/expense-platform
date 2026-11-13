import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCsvPreview, applyMapping } from '@/lib/csv';
import { categorizeTransaction } from '@/lib/categorize';
import { csvMappingSchema } from '@/lib/validation';
import { refreshAlerts } from '@/lib/alerts';
import { route } from '@/lib/http';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export const POST = route(async (req: NextRequest) => {
  const body = await req.json();

  if (body.mode === 'preview') {
    if (typeof body.csv !== 'string' || !body.csv.trim()) {
      return NextResponse.json({ error: 'csv text is required' }, { status: 400 });
    }
    const preview = parseCsvPreview(body.csv);
    if (preview.headers.length === 0) {
      return NextResponse.json({ error: 'Could not find a header row in this file' }, { status: 400 });
    }
    return NextResponse.json(preview);
  }

  if (body.mode === 'commit') {
    const mapping = csvMappingSchema.safeParse(body.mapping);
    if (!mapping.success || typeof body.csv !== 'string') {
      return NextResponse.json({ error: 'Invalid mapping or csv' }, { status: 400 });
    }

    const { rows, invalidRows } = applyMapping(body.csv, mapping.data);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            invalidRows > 0
              ? `No usable rows: ${invalidRows} row(s) had a date or amount that couldn't be read. Check the column mapping.`
              : 'No valid rows found for the given mapping',
        },
        { status: 400 }
      );
    }
    const existing = await prisma.transaction.findMany({
      where: { fingerprint: { in: rows.map((r) => r.fingerprint) } },
      select: { fingerprint: true },
    });
    const existingSet = new Set(existing.map((e) => e.fingerprint));

    const newRows = rows.filter((r) => !existingSet.has(r.fingerprint));
    const skipped = rows.length - newRows.length;

    const categories = await prisma.category.findMany();
    const importBatch = crypto.randomUUID();

    let imported = 0;
    const CHUNK = 500;
    for (let i = 0; i < newRows.length; i += CHUNK) {
      const chunk = newRows.slice(i, i + CHUNK);
      const result = await prisma.transaction.createMany({
        data: chunk.map((row) => ({
          date: new Date(row.date),
          description: row.description,
          amount: row.amount,
          type: row.type,
          source: 'csv-import',
          importBatch,
          fingerprint: row.fingerprint,
          categoryId: categorizeTransaction(row.description, categories),
        })),
        skipDuplicates: true,
      });
      imported += result.count;
    }

    await refreshAlerts();

    return NextResponse.json({
      imported,
      skippedDuplicates: skipped + (newRows.length - imported),
      skippedInvalid: invalidRows,
      importBatch,
    });
  }

  return NextResponse.json({ error: 'mode must be "preview" or "commit"' }, { status: 400 });
});
