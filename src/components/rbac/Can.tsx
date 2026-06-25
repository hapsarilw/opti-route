'use client';

import type { ReactNode } from 'react';
import type { Permission } from '@/types';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Conditional-render gate for permission-critical UI (Doc 01 §4 / SDD §14).
 * Wrap any action the current role may not hold, e.g.:
 *   <Can permission="manifest:delete"><DeleteButton/></Can>
 */
export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allowed = useAuthStore((s) => s.user.permissions.includes(permission));
  return <>{allowed ? children : fallback}</>;
}
