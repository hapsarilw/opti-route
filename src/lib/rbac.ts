import type { Permission, Role } from '@/types';

/**
 * RBAC matrix — Doc 01 §4. Single source of truth for which role holds which
 * permission. Used to derive `User.permissions`, gate <Can>, and guard routes.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'manifest:read',
    'manifest:delete',
    'route:optimize',
    'route:dispatch',
    'config:tariff:read',
    'config:tariff:write',
  ],
  dispatcher: ['manifest:read', 'route:optimize', 'route:dispatch'],
  manager: ['manifest:read', 'config:tariff:read'],
};

/** Permissions granted to a role. */
export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Does this permission set include the required one? */
export function can(permissions: Permission[], required: Permission): boolean {
  return permissions.includes(required);
}

/** Access level for the /settings/tariff page (Doc 01 §4): full / read-only / blocked. */
export function tariffAccess(role: Role): 'write' | 'read' | 'denied' {
  const perms = permissionsForRole(role);
  if (perms.includes('config:tariff:write')) return 'write';
  if (perms.includes('config:tariff:read')) return 'read';
  return 'denied';
}
