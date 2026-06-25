'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import { SYSTEM_NAV, WORKSPACE_NAV, type NavItem } from '@/config/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[12.5px] transition-colors',
        active
          ? 'border-accent-bright/20 bg-accent-bright/10 font-semibold text-text-primary'
          : 'border-transparent font-normal text-text-secondary hover:bg-surface-3',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent-bright' : 'text-text-muted')} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const permissions = useAuthStore((s) => s.user.permissions);
  const visible = (item: NavItem) => !item.requires || permissions.includes(item.requires);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="flex w-[220px] min-w-[220px] flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#27A074] to-[#1B7A55] shadow-[0_3px_10px_rgba(30,138,99,0.32)]">
            <Zap className="h-4 w-4 text-white" fill="white" />
          </div>
          <div>
            <div className="font-display text-[14.5px] font-bold leading-tight tracking-[-0.4px] text-text-primary">
              OptiRoute
            </div>
            <div className="text-[9.5px] font-medium uppercase tracking-wider text-text-muted">
              Fleet Ops
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
        <div className="px-2 pb-1 pt-1.5 text-[9px] font-bold uppercase tracking-[1.4px] text-text-muted">
          Workspace
        </div>
        {WORKSPACE_NAV.filter(visible).map((item) => (
          <NavLink key={item.id} item={item} active={isActive(item.href)} />
        ))}

        <div className="mx-1 my-2.5 h-px bg-surface-3" />
        <div className="px-2 pb-1 text-[9px] font-bold uppercase tracking-[1.4px] text-text-muted">
          System
        </div>
        {SYSTEM_NAV.filter(visible).map((item) => (
          <NavLink key={item.id} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border px-3.5 py-3">
        <UserCard />
      </div>
    </aside>
  );
}

function UserCard() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#3B5A8C] font-display text-[11px] font-bold text-white">
        US
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11.5px] font-semibold text-text-secondary">{user.user_id}</div>
        <div className="mt-px font-mono text-[10px] capitalize text-text-muted">{user.role}</div>
      </div>
    </div>
  );
}
