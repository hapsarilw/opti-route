import { create } from 'zustand';
import type { AlertTone } from '@/components/ui/Alert';

/**
 * Ephemeral toast notifications (client-only UI state, per Doc 01 §6).
 * Process 2 uses these for optimize success / failure feedback; reusable across
 * features. Toasts auto-dismiss after DISMISS_MS or on manual close.
 */
export interface ToastItem {
  id: string;
  tone: AlertTone;
  title: string;
  message?: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

const DISMISS_MS = 5_000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = `tst_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, DISMISS_MS);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Imperative helper so non-component code (mutations) can raise toasts. */
export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().push({ tone: 'success', title, message }),
  error: (title: string, message?: string) => useToastStore.getState().push({ tone: 'error', title, message }),
  warning: (title: string, message?: string) => useToastStore.getState().push({ tone: 'warning', title, message }),
  info: (title: string, message?: string) => useToastStore.getState().push({ tone: 'info', title, message }),
};
