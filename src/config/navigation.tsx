import { LayoutGrid, Zap, Map, Send, Settings, type LucideIcon } from 'lucide-react';
import type { Permission } from '@/types';

/** A single sidebar navigation entry. */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** When set, the link only renders for users holding this permission. */
  requires?: Permission;
}

/** Primary workspace nav — maps 1:1 to the 4 business processes (P1–P4). */
export const WORKSPACE_NAV: NavItem[] = [
  { id: 'manifests', label: 'Manifests', href: '/manifests', icon: LayoutGrid },
  { id: 'optimize', label: 'Optimize', href: '/optimize', icon: Zap, requires: 'route:optimize' },
  { id: 'map', label: 'Live Map', href: '/map', icon: Map },
  { id: 'dispatch', label: 'Dispatch', href: '/dispatch', icon: Send, requires: 'route:dispatch' },
];

/** System nav — RBAC-gated settings. */
export const SYSTEM_NAV: NavItem[] = [
  { id: 'tariff', label: 'Settings', href: '/settings/tariff', icon: Settings, requires: 'config:tariff:read' },
];
