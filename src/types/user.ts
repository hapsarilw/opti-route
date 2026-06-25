import type { Permission, Role } from './enums';

/** User — account + RBAC subject (Doc 01 §2.5). Permissions derive from role (§4). */
export interface User {
  user_id: string; // "usr_99823"
  name: string;
  role: Role;
  permissions: Permission[];
}
