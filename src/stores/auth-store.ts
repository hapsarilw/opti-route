import { create } from 'zustand';
import type { Permission, Role, User } from '@/types';
import { permissionsForRole } from '@/lib/rbac';

/**
 * Auth + RBAC state. In-memory only (NO localStorage) per CLAUDE.md — mirrors a
 * non-persisted httpOnly token model. The role switcher in the top bar mutates
 * this, which re-derives permissions for <Can> gating and route guards.
 */
interface AuthState {
  user: User;
  setRole: (role: Role) => void;
  hasPermission: (permission: Permission) => boolean;
}

const makeUser = (role: Role): User => ({
  user_id: 'usr_99823',
  name: 'Dispatcher',
  role,
  permissions: permissionsForRole(role),
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: makeUser('dispatcher'),
  setRole: (role) => set({ user: makeUser(role) }),
  hasPermission: (permission) => get().user.permissions.includes(permission),
}));
