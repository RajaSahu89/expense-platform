import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseCsvPreview, applyMapping, CsvColumnMapping } from '@/lib/csv';
import { categorizeTransaction } from '@/lib/categorize';
import { csvMappingSchema } from '@/lib/validation';
import { refreshAlerts } from '@/lib/alerts';
import crypto from 'crypto';

/**
 * Step 1 — preview: `{ mode: "preview", csv: string }`
 * Returns detected headers + a few sample rows so the user can map columns.
 *
 * Step 2 — commit: `{ mode: "commit", csv: string, mapping: CsvColumnMapping }`
 * Re-parses the full file, skips rows whose fingerprint already exists
 * (idempotent re-import), auto-categorizes, and inserts the rest tagged
 * with a shared `importBatch` id so the whole batch can be undone later.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.mode === 'preview') {
    if (typeof body.csv !== 'string' || !body.csv.trim()) {
      return NextResponse.json({ error: 'csv text is required' }, { status: 400 });
    }
    const preview = parseCsvPreview(body.csv);
    return NextResponse.json(preview);
  }

  if (body.mode === 'commit') {
    const mapping = csvMappingSchema.safeParse(body.mapping);
    if (!mapping.success || typeof body.csv !== 'string') {
      return NextResponse.json({ error: 'Invalid mapping or csv' }, { status: 400 });
    }

    const rows = applyMapping(body.csv, mapping.data as CsvColumnMapping);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found for the given mapping' }, { status: 400 });
    }

    const fingerprints = rows.map((r) => r.fingerprint);
    // We store the fingerprint in `notes` prefixed with a marker so we can
    // detect duplicates without a schema migration; a production build
    // would add a dedicated indexed column instead.
    const existing = await prisma.transaction.findMany({
      where: { notes: { in: fingerprints.map((f) => `fp:${f}`) } },
      select: { notes: true },
    });
    const existingSet = new Set(existing.map((e) => e.notes));

    const newRows = rows.filter((r) => !existingSet.has(`fp:${r.fingerprint}`));
    const skipped = rows.length - newRows.length;

    const categories = await prisma.category.findMany();
    const importBatch = crypto.randomUUID();

    const created = await prisma.$transaction(
      newRows.map((row) =>
        prisma.transaction.create({
          data: {
            date: new Date(row.date),
            description: row.description,
            amount: row.amount,
            type: row.type,
            source: 'csv-import',
            importBatch,
            notes: `fp:${row.fingerprint}`,
            categoryId: categorizeTransaction(row.description, categories),
          },
        })
      )
    );

    await refreshAlerts();

    return NextResponse.json({
      imported: created.length,
      skippedDuplicates: skipped,
      importBatch,
    });
  }

  return NextResponse.json({ error: 'mode must be "preview" or "commit"' }, { status: 400 });
}
