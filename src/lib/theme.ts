export type Theme = 'dark' | 'light';

/**
 * Tiny external store for the active theme, backed by <html data-theme> +
 * localStorage. Consumed via useSyncExternalStore so the toggle stays in sync
 * without effects and without hydration mismatches (server snapshot = 'dark').
 */
const listeners = new Set<() => void>();

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return (document.documentElement.getAttribute('data-theme') as Theme) ?? 'dark';
}

export const themeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): Theme {
    return readTheme();
  },
  getServerSnapshot(): Theme {
    return 'dark';
  },
  toggle() {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('optiroute-theme', next);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
};
