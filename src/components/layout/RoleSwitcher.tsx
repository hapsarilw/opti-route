'use client';

import { ROLES } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

/** Segmented control to switch the active role (admin/dispatcher/manager) for the RBAC demo. */
export function RoleSwitcher() {
  const role = useAuthStore((s) => s.user.role);
  const setRole = useAuthStore((s) => s.setRole);

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface-0 p-0.5">
      {ROLES.map((r) => {
        const active = r === role;
        return (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] capitalize transition-colors',
              active
                ? 'bg-surface-2 font-semibold text-accent-bright'
                : 'font-normal text-text-muted hover:text-text-secondary',
            )}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
