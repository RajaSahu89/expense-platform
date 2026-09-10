import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshAlerts } from '@/lib/alerts';

export async function GET() {
  await refreshAlerts();
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return NextResponse.json({ alerts });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (body.markAllRead) {
    await prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } });
    return NextResponse.json({ success: true });
  }
  if (body.id) {
    const alert = await prisma.alert.update({ where: { id: body.id }, data: { isRead: true } });
    return NextResponse.json({ alert });
  }
  return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 });
}
