'use client';

import { X } from 'lucide-react';
import { useToastStore } from '@/stores/toast-store';
import { Alert } from '@/components/ui/Alert';

/**
 * Global toast stack — bottom-right, above all content. Renders the shared Alert
 * component per toast with a manual close. Mounted once in the AppShell.
 */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto relative animate-fade-up">
          <Alert tone={t.tone} title={t.title} className="pr-8 shadow-[0_8px_28px_rgba(0,0,0,0.4)]">
            {t.message}
          </Alert>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-text-muted hover:bg-surface-2 hover:text-text-secondary"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
