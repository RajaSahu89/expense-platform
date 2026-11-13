'use client';

import { Badge } from './ui';

export interface AlertItem {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  isRead: boolean;
}

const toneFor = { INFO: 'neutral', WARNING: 'warn', CRITICAL: 'danger' } as const;

export default function AlertBanner({
  alerts,
  onDismiss,
}: {
  alerts: AlertItem[];
  onDismiss?: (id: string) => void;
}) {
  const unread = alerts.filter((a) => !a.isRead);
  if (unread.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {unread.slice(0, 4).map((alert) => (
        <div key={alert.id} className="glass flex items-start gap-3 rounded-2xl px-4 py-3">
          <Badge tone={toneFor[alert.severity]}>{alert.severity}</Badge>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{alert.title}</p>
            <p className="text-sm text-muted">{alert.message}</p>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(alert.id)}
              aria-label={`Dismiss alert: ${alert.title}`}
              className="h-7 w-7 shrink-0 rounded-full text-muted hover:text-ink hover:bg-white/10 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
