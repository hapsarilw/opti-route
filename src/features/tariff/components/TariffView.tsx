'use client';

import { Lock, Pencil, Trash2, Eye, ArrowLeft } from 'lucide-react';
import type { Role } from '@/types';
import { PageHeader } from '@/components/shared/PageHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Can } from '@/components/rbac/Can';
import { useAuthStore } from '@/stores/auth-store';
import { tariffAccess } from '@/lib/rbac';
import { cn } from '@/lib/utils';

/** "● role admin" pill — green for admin (write), amber for manager (read). */
function RoleBadge({ role }: { role: Role }) {
  const color = role === 'admin' ? '#3FBF8E' : role === 'manager' ? '#FBBF24' : '#F87171';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-input border px-3 py-1.5 font-mono text-[11px] font-bold"
      style={{ color, borderColor: `${color}4D`, backgroundColor: `${color}1F` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      role {role}
    </span>
  );
}

const BASE_FIELDS = [
  { label: 'Base Rate per KM', prefix: 'Rp', value: '3.500', suffix: '/ km', hint: 'Standard distance rate' },
  { label: 'Minimum Rate', prefix: 'Rp', value: '25.000', suffix: '', hint: 'Minimum per delivery' },
];
const ADD_FIELDS = [
  { label: 'Fee per Kg', prefix: 'Rp', value: '1.200', suffix: '/ kg', hint: 'Applies > 10 kg' },
  { label: 'Fuel Surcharge', prefix: '', value: '12', suffix: '%', hint: 'Fuel adjustment' },
  { label: 'Express Multiplier', prefix: '', value: '1.8', suffix: '×', hint: 'Same-day service' },
];
const ZONES = [
  { code: 'A', name: 'Denpasar Metro', desc: 'Inner city & surroundings', mult: '1.0' },
  { code: 'B', name: 'South Bali', desc: 'Kuta, Seminyak, Jimbaran, Nusa Dua', mult: '1.4' },
  { code: 'C', name: 'Central / East Bali', desc: 'Ubud, Gianyar, Klungkung', mult: '2.2' },
  { code: 'D', name: 'North / Remote', desc: 'Singaraja, Karangasem', mult: '3.5' },
];

function Field({
  label,
  prefix,
  value,
  suffix,
  hint,
  locked,
}: {
  label: string;
  prefix?: string;
  value: string;
  suffix?: string;
  hint: string;
  locked: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-text-secondary">{label}</label>
      <div
        className={cn(
          'flex h-10 items-center rounded-[9px] border px-3',
          locked ? 'border-border-subtle bg-surface-0/50 opacity-55' : 'border-border bg-surface-0',
        )}
      >
        {prefix && <span className="mr-2 font-mono text-xs text-text-muted">{prefix}</span>}
        <input
          defaultValue={value}
          disabled={locked}
          className={cn(
            'min-w-0 flex-1 border-none bg-transparent font-mono text-sm font-semibold text-text-primary outline-none',
            locked && 'cursor-not-allowed',
          )}
        />
        {suffix && <span className="ml-2 whitespace-nowrap font-mono text-xs text-text-muted">{suffix}</span>}
      </div>
      <span className="text-[10.5px] text-text-muted">{hint}</span>
    </div>
  );
}

function SectionCard({ title, extra, children }: { title: string; extra?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[13px] border border-border bg-surface-1">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[1.2px] text-text-muted">{title}</span>
        {extra && <span className="font-mono text-[10.5px] text-text-muted">{extra}</span>}
      </div>
      {children}
    </div>
  );
}

export function TariffView() {
  const role = useAuthStore((s) => s.user.role);
  const access = tariffAccess(role);
  const locked = access === 'read';

  if (access === 'denied') {
    return (
      <div className="flex h-[calc(100vh-52px)] flex-col items-center justify-center gap-4 p-6 animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-error/30 bg-error/12">
          <Lock className="h-7 w-7 text-[#F87171]" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-[20px] font-bold text-text-primary">Access Restricted</h1>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-text-secondary">
            The <strong className="text-text-secondary">Tariff Configuration</strong> page is only available to{' '}
            <strong className="text-accent-bright">Admin</strong> (write) and{' '}
            <strong className="text-[#FBBF24]">Manager</strong> (read). You are signed in as{' '}
            <strong className="text-[#F87171]">{role}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-0 px-3.5 py-2 font-mono text-[10.5px]">
          <span className="font-semibold text-[#F87171]">403</span>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted">
            guard(role) → required: <span className="text-accent-bright">admin</span> · current:{' '}
            <span className="text-[#F87171]">{role}</span>
          </span>
        </div>
        <Button variant="secondary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5 animate-fade-up">
      <PageHeader
        title="Tariff Configuration"
        meta="Last modified Jun 12, 2026 · usr_admin_01"
        actions={
          <>
            <RoleBadge role={role} />
            <Can permission="config:tariff:write">
              <Button variant="primary">
                <Pencil className="h-3.5 w-3.5" /> Edit Tariff
              </Button>
            </Can>
            <Can permission="manifest:delete">
              <Button variant="danger">
                <Trash2 className="h-3.5 w-3.5" /> Delete Manifest
              </Button>
            </Can>
            {locked && (
              <span className="inline-flex items-center gap-1.5 rounded-input border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-3 py-1.5 text-xs font-bold text-[#FBBF24]">
                <Eye className="h-3.5 w-3.5" /> View only
              </span>
            )}
          </>
        }
      />

      {locked && (
        <Alert tone="warning" title="Read-only access">
          Your access is limited to <strong className="text-[#FBBF24]">read only</strong>. All fields are locked.
          Contact an <strong className="text-text-secondary">Admin</strong> to change tariff rates.
        </Alert>
      )}

      <SectionCard title="Base Tariff">
        <div className="grid grid-cols-2 gap-3.5 p-4">
          {BASE_FIELDS.map((f) => (
            <Field key={f.label} {...f} locked={locked} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Additional Fees">
        <div className="grid grid-cols-3 gap-3.5 p-4">
          {ADD_FIELDS.map((f) => (
            <Field key={f.label} {...f} locked={locked} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Delivery Zones · Multiplier" extra="4 zones">
        {ZONES.map((z) => (
          <div key={z.code} className="flex items-center gap-3 border-t border-border-subtle px-4 py-3">
            <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-border bg-surface-0 font-display text-[13px] font-bold text-accent-bright">
              {z.code}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold text-text-secondary">{z.name}</div>
              <div className="mt-px text-[10.5px] text-text-muted">{z.desc}</div>
            </div>
            <div
              className={cn(
                'flex h-[34px] w-24 shrink-0 items-center rounded-lg border px-2.5',
                locked ? 'border-border-subtle bg-surface-0/50 opacity-55' : 'border-border bg-surface-0',
              )}
            >
              <input
                defaultValue={z.mult}
                disabled={locked}
                className={cn(
                  'min-w-0 flex-1 border-none bg-transparent text-right font-mono text-[13.5px] font-semibold text-text-primary outline-none',
                  locked && 'cursor-not-allowed',
                )}
              />
              <span className="ml-1.5 font-mono text-xs text-text-muted">×</span>
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
