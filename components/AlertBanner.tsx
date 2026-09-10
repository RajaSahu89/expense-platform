'use client';

import { Badge } from './ui';

export interface AlertItem {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  isRead: boolean;
}

const toneFor = { INFO: 'gold', WARNING: 'gold', CRITICAL: 'rust' } as const;

export default function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  const unread = alerts.filter((a) => !a.isRead);
  if (unread.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {unread.slice(0, 4).map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 border border-line bg-panel rounded px-4 py-3"
        >
          <Badge tone={toneFor[alert.severity]}>{alert.severity}</Badge>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{alert.title}</p>
            <p className="text-sm text-slate">{alert.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
