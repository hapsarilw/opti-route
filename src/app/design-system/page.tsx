import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MANIFEST_STATUSES, PRIORITIES } from '@/types';
import { Section, CardLabel } from '@/components/shared/Section';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PriorityChip } from '@/components/shared/PriorityChip';
import { Skeleton } from '@/components/shared/SkeletonLoader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SearchField } from '@/components/ui/SearchField';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export const metadata = { title: 'Design System · OptiRoute' };

const SURFACES = [
  { token: 'surface-0', cls: 'bg-surface-0', desc: 'App background / canvas' },
  { token: 'surface-1', cls: 'bg-surface-1', desc: 'Card, panel, sidebar' },
  { token: 'surface-2', cls: 'bg-surface-2', desc: 'Elevated, dropdown, modal' },
  { token: 'surface-3', cls: 'bg-surface-3', desc: 'Hover, selected row' },
];
const TEXTS = [
  { token: 'text-primary', cls: 'text-text-primary', sample: 'Headlines & table data' },
  { token: 'text-secondary', cls: 'text-text-secondary', sample: 'Labels & secondary text' },
  { token: 'text-muted', cls: 'text-text-muted', sample: 'Placeholder, disabled, meta' },
];
const SEMANTICS = [
  { label: 'Success', cls: 'bg-success', usage: 'Confirmed, delivered' },
  { label: 'Warning', cls: 'bg-warning', usage: 'Delay risk, attention' },
  { label: 'Error', cls: 'bg-error', usage: 'Exception, failed SLA' },
  { label: 'Info', cls: 'bg-info', usage: 'System notice, update' },
];
const TYPE_SCALE = [
  { name: 'Page Title', cls: 'font-display text-[30px] font-extrabold tracking-[-0.8px]', spec: '30 / 800 / Space Grotesk' },
  { name: 'Section Head', cls: 'font-display text-[19px] font-bold tracking-[-0.3px]', spec: '19 / 700 / Space Grotesk' },
  { name: 'Card Title', cls: 'text-[14px] font-bold', spec: '14 / 700 / Hanken' },
  { name: 'Body', cls: 'text-[13px]', spec: '13 / 400 / Hanken' },
  { name: 'Caption', cls: 'text-[11px] text-text-muted', spec: '11 / 400 / Hanken' },
  { name: 'Mono — Data', cls: 'font-mono text-[13px] text-accent-bright', spec: '13 / 500 / JetBrains Mono' },
];
const SPACING = [4, 8, 12, 16, 20, 24, 32, 40];
const BTN_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-surface-0 px-10 py-12">
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-3 flex items-end justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-gradient-to-br from-[#27A074] to-[#1B7A55] shadow-[0_4px_16px_rgba(30,138,99,0.35)]">
              <span className="font-display text-lg font-bold text-white">O</span>
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-text-muted">
                OptiRoute Platform
              </div>
              <h1 className="font-display text-[30px] font-extrabold tracking-[-0.8px] text-text-primary">
                Design System <span className="text-accent-bright">v1.0</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/manifests"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-bright hover:opacity-70"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to app
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="mb-12 h-px bg-gradient-to-r from-accent via-accent/30 to-transparent" />

        {/* 01 — Foundation */}
        <Section index="01" title="Foundation">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-surface-1 p-5">
              <CardLabel>Surface Stack</CardLabel>
              <div className="flex flex-col gap-1.5">
                {SURFACES.map((s) => (
                  <div key={s.token} className="flex items-center gap-3 rounded-lg bg-surface-0 px-2.5 py-1.5">
                    <div className={`h-[34px] w-[34px] shrink-0 rounded-lg border border-border-subtle ${s.cls}`} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[11.5px] font-semibold text-text-primary">{s.token}</div>
                      <div className="text-[10.5px] text-text-muted">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-1 p-5">
              <CardLabel>Text Hierarchy</CardLabel>
              <div className="flex flex-col gap-2.5">
                {TEXTS.map((t) => (
                  <div key={t.token} className={t.cls}>
                    <span className="text-[13px]">{t.sample}</span>
                    <span className="ml-2 font-mono text-[10.5px] text-text-muted">{t.token}</span>
                  </div>
                ))}
              </div>
              <CardLabel>Accent</CardLabel>
              <div className="flex gap-2">
                <span className="rounded-md bg-accent px-3 py-1 text-[11px] font-semibold text-white">accent</span>
                <span className="rounded-md bg-accent-hover px-3 py-1 text-[11px] font-semibold text-white">accent-hover</span>
                <span className="rounded-md border border-accent-bright/30 bg-accent-bright/10 px-3 py-1 text-[11px] font-semibold text-accent-bright">
                  accent-bright
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-surface-1 p-5">
            <CardLabel>Semantic Colors</CardLabel>
            <div className="grid grid-cols-4 gap-3">
              {SEMANTICS.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-surface-0 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.cls}`} />
                    <span className="font-display text-[11.5px] font-bold text-text-primary">{s.label}</span>
                  </div>
                  <div className="text-[11px] text-text-muted">{s.usage}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 02 — Status & Priority */}
        <Section index="02" title="Status System">
          <div className="rounded-2xl border border-border bg-surface-1 p-5">
            <CardLabel>Manifest Status — 9 states (OPTIMIZING pulses · EXCEPTION flashes)</CardLabel>
            <div className="flex flex-wrap gap-2">
              {MANIFEST_STATUSES.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
            <div className="mt-5">
              <CardLabel>Priority Chips</CardLabel>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <PriorityChip key={p} priority={p} />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 03 — Typography */}
        <Section index="03" title="Typography">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="grid grid-cols-[160px_1fr] items-center border-b border-border-subtle last:border-0">
                <div className="border-r border-border-subtle px-5 py-3.5">
                  <div className="text-[11.5px] font-semibold text-text-secondary">{t.name}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-text-muted">{t.spec}</div>
                </div>
                <div className={`px-6 py-3.5 text-text-primary ${t.cls}`}>The quick brown fox · 1,284 kg · ETA 14:32</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 04 — Spacing */}
        <Section index="04" title="Spacing & Density">
          <div className="rounded-2xl border border-border bg-surface-1 p-5">
            <CardLabel>4px Base Grid</CardLabel>
            <div className="flex flex-wrap items-end gap-5">
              {SPACING.map((px) => (
                <div key={px} className="flex flex-col items-center gap-2">
                  <div className="rounded-sm bg-accent/55" style={{ width: px, height: px }} />
                  <div className="font-mono text-[9.5px] text-text-muted">{px}px</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-text-secondary">
              <div className="rounded-lg border border-border bg-surface-0 px-3 py-1.5">
                Compact row · <span className="font-mono text-text-muted">32px · pad 6/12</span>
              </div>
              <div className="rounded-lg border border-border bg-surface-0 px-4 py-3">
                Comfortable row · <span className="font-mono text-text-muted">44px · pad 12/16</span>
              </div>
            </div>
          </div>
        </Section>

        {/* 05 — Components */}
        <Section index="05" title="Core Components">
          <div className="rounded-2xl border border-border bg-surface-1 p-5">
            <CardLabel>Button — 4 variants × 4 states</CardLabel>
            <div className="flex flex-col gap-3.5">
              {BTN_VARIANTS.map((v) => (
                <div key={v} className="flex flex-wrap items-center gap-2.5">
                  <span className="w-20 text-[11px] font-semibold capitalize text-text-muted">{v}</span>
                  <Button variant={v}>Default</Button>
                  <Button variant={v} className="bg-accent-hover">Hover</Button>
                  <Button variant={v} loading>Loading</Button>
                  <Button variant={v} disabled>Disabled</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-surface-1 p-5">
              <CardLabel>Input & Search</CardLabel>
              <div className="flex flex-col gap-2.5">
                <SearchField placeholder="Search manifests…" />
                <Input placeholder="Default input" />
                <Input invalid defaultValue="Invalid coordinate" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface-1 p-5">
              <CardLabel>Checkbox — row selection</CardLabel>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-xs text-text-secondary">
                  <Checkbox /> Unchecked
                </span>
                <span className="flex items-center gap-2 text-xs text-text-secondary">
                  <Checkbox checked /> Checked
                </span>
                <span className="flex items-center gap-2 text-xs text-text-secondary">
                  <Checkbox indeterminate /> Indeterminate
                </span>
              </div>
              <div className="mt-5">
                <CardLabel>Skeleton Loader</CardLabel>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-3/5 animate-shimmer" />
                  <Skeleton className="h-3 w-2/5 animate-shimmer" />
                  <Skeleton className="h-3 w-4/5 animate-shimmer" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Alert tone="success" title="Route Optimized" time="now">
              3 manifests sorted. ETA 3h 42m.
            </Alert>
            <Alert tone="warning" title="Delay Alert" time="3m ago">
              MF-4501 ETA pushed +45 min.
            </Alert>
            <Alert tone="error" title="Exception — SLA" time="12m ago">
              MNF-240015 overdue by 2h.
            </Alert>
            <Alert tone="info" title="System Sync" time="1m ago">
              Fleet telemetry re-synced.
            </Alert>
          </div>
        </Section>
      </div>
    </div>
  );
}
