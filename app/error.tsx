'use client';

import { Button, Card } from '@/components/ui';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-5 md:px-10 py-10 max-w-xl">
      <Card className="p-8 text-center">
        <p className="font-display text-2xl mb-2">Something went wrong</p>
        <p className="text-sm text-muted mb-5">{error.message || 'An unexpected error occurred.'}</p>
        <Button onClick={reset}>Try again</Button>
      </Card>
    </div>
  );
}
