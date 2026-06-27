'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { LiveIndicator } from './LiveIndicator';
import { RoleSwitcher } from './RoleSwitcher';
import { ThemeToggle } from './ThemeToggle';

const BREADCRUMBS: Record<string, string> = {
  '/manifests': 'Manifests / Grid',
  '/optimize': 'Optimize / AI Route',
  '/map': 'Live Map / Telemetry',
  '/dispatch': 'Dispatch / Control',
  '/settings/tariff': 'Settings / Tariff',
};

function breadcrumbFor(pathname: string): string {
  const hit = Object.keys(BREADCRUMBS).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  return hit ? BREADCRUMBS[hit] : 'Dashboard';
}

/** Two-letter avatar initials per role (matches the RBAC prototype: AD / DS / MG). */
const ROLE_INITIALS: Record<string, string> = {
  admin: 'AD',
  dispatcher: 'DS',
  manager: 'MG',
};

export function TopBar() {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user.role);
  const initials = ROLE_INITIALS[role] ?? 'US';

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border bg-sidebar px-5">
      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="whitespace-nowrap text-xs text-text-muted">OptiRoute</span>
        <span className="text-xs text-text-muted">/</span>
        <span className="truncate text-[12.5px] font-semibold text-text-secondary">
          {breadcrumbFor(pathname)}
        </span>
      </div>

      <LiveIndicator count={4} />
      <RoleSwitcher />

      {/* Search (visual placeholder for now) */}
      <div className="flex h-8 w-[188px] shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-0 px-3">
        <Search className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-xs text-text-muted">Search…</span>
      </div>

      <ThemeToggle />

      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-gradient-to-br from-accent to-[#3B5A8C] font-display text-[11px] font-bold text-white">
        {initials}
      </div>
    </header>
  );
}
