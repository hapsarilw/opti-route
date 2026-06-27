import { create } from 'zustand';
import type { Permission, Role, User } from '@/types';
import { permissionsForRole } from '@/lib/rbac';

/**
 * Auth + RBAC state. In-memory only (NO localStorage) per CLAUDE.md / SDD §14 —
 * mirrors a non-persisted httpOnly token model so a page refresh resets to the
 * default identity and the token can never be tampered with from storage. The
 * role switcher in the top bar mutates this, which re-derives permissions for
 * <Can> gating and route guards.
 */

/** Preset demo identities — one in-memory "JWT" per role (Doc 01 §2.5 / §4). */
const USER_PRESETS: Record<Role, Pick<User, 'user_id' | 'name'>> = {
  admin: { user_id: 'usr_admin_01', name: 'Admin' },
  dispatcher: { user_id: 'usr_99823', name: 'Dispatcher' },
  manager: { user_id: 'usr_manager_01', name: 'Manager' },
};

interface AuthState {
  user: User;
  setRole: (role: Role) => void;
  hasPermission: (permission: Permission) => boolean;
}

const makeUser = (role: Role): User => ({
  ...USER_PRESETS[role],
  role,
  permissions: permissionsForRole(role),
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: makeUser('dispatcher'),
  setRole: (role) => set({ user: makeUser(role) }),
  hasPermission: (permission) => get().user.permissions.includes(permission),
}));
