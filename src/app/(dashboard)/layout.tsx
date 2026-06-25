import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

/** Shared control-room frame for every workspace + settings page. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
