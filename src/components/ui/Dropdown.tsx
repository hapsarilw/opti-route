'use client';

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
  hint?: string;
  warning?: string;
  disabled?: boolean;
}

export interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

// Internal flat list — headers are non-interactive spacers; options are selectable.
type FlatItem =
  | { kind: 'header'; label: string }
  | { kind: 'option'; option: DropdownOption };

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  renderTrigger: (state: { selected?: DropdownOption; open: boolean }) => ReactNode;
  align?: 'start' | 'end';
  className?: string;
  menuClassName?: string;
  'aria-label'?: string;
} & (
  | { options: DropdownOption[]; groups?: never }
  | { groups: DropdownGroup[]; options?: never }
);

/**
 * Accessible select-only combobox (WAI-ARIA listbox pattern).
 * Accepts either a flat `options` array or a grouped `groups` array.
 * Keyboard: ↑/↓ move, Home/End jump, Enter/Space select, Esc closes, type-ahead.
 */
export function Dropdown({
  value,
  onChange,
  renderTrigger,
  align = 'start',
  className,
  menuClassName,
  'aria-label': ariaLabel,
  ...rest
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ str: '', at: 0 });
  const baseId = useId();

  // Flatten groups or plain options into a single list the renderer walks.
  const flatItems: FlatItem[] = useMemo(() => {
    if ('groups' in rest && rest.groups) {
      return rest.groups.flatMap((g) => [
        { kind: 'header' as const, label: g.label },
        ...g.options.map((o) => ({ kind: 'option' as const, option: o })),
      ]);
    }
    return (rest.options ?? []).map((o) => ({ kind: 'option' as const, option: o }));
  }, [rest]);

  const selected = useMemo<DropdownOption | undefined>(() => {
    const item = flatItems.find((f) => f.kind === 'option' && f.option.value === value);
    return item?.kind === 'option' ? item.option : undefined;
  }, [flatItems, value]);

  const selectedFlatIdx = useMemo(
    () => flatItems.findIndex((f) => f.kind === 'option' && f.option.value === value),
    [flatItems, value],
  );

  const isSelectableAt = (i: number) => {
    const item = flatItems[i];
    return item?.kind === 'option' && !item.option.disabled;
  };

  const firstEnabled = () => flatItems.findIndex((_, i) => isSelectableAt(i));
  const lastEnabled = () => {
    for (let i = flatItems.length - 1; i >= 0; i--) if (isSelectableAt(i)) return i;
    return -1;
  };

  const openMenu = () => {
    const start = selectedFlatIdx >= 0 && isSelectableAt(selectedFlatIdx)
      ? selectedFlatIdx
      : firstEnabled();
    setActiveIndex(start);
    setOpen(true);
  };

  const closeMenu = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const selectAt = (i: number) => {
    const item = flatItems[i];
    if (!item || item.kind === 'header' || item.option.disabled) return;
    onChange(item.option.value);
    closeMenu();
  };

  // Step active index, wrapping around, skipping headers + disabled options.
  const moveActive = (dir: 1 | -1) => {
    setActiveIndex((cur) => {
      const n = flatItems.length;
      if (n === 0) return -1;
      let idx = cur < 0 ? (dir === 1 ? -1 : n) : cur;
      for (let i = 0; i < n; i++) {
        idx = (idx + dir + n) % n;
        if (isSelectableAt(idx)) return idx;
      }
      return cur;
    });
  };

  const onTypeahead = (char: string) => {
    const now = Date.now();
    const ta = typeahead.current;
    ta.str = now - ta.at > 600 ? char : ta.str + char;
    ta.at = now;
    const q = ta.str.toLowerCase();
    const idx = flatItems.findIndex(
      (f) => f.kind === 'option' && !f.option.disabled && f.option.label.toLowerCase().startsWith(q),
    );
    if (idx >= 0) setActiveIndex(idx);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (open) moveActive(1);
        else openMenu();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) moveActive(-1);
        else openMenu();
        break;
      case 'Home':
        if (open) { e.preventDefault(); setActiveIndex(firstEnabled()); }
        break;
      case 'End':
        if (open) { e.preventDefault(); setActiveIndex(lastEnabled()); }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) openMenu();
        else if (activeIndex >= 0) selectAt(activeIndex);
        break;
      case 'Escape':
        if (open) { e.preventDefault(); closeMenu(); }
        break;
      case 'Tab':
        if (open) setOpen(false);
        break;
      default:
        if (open && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          onTypeahead(e.key);
        }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Scroll the active item into view while keyboard navigating.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const hasOptions = flatItems.some((f) => f.kind === 'option');

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${baseId}-listbox`}
        aria-label={ariaLabel}
        aria-activedescendant={
          open && activeIndex >= 0 && isSelectableAt(activeIndex)
            ? `${baseId}-opt-${activeIndex}`
            : undefined
        }
        onClick={() => (open ? closeMenu(false) : openMenu())}
        onKeyDown={onKeyDown}
        className="w-full rounded-input text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {renderTrigger({ selected, open })}
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${baseId}-listbox`}
          role="listbox"
          tabIndex={-1}
          className={cn(
            'absolute z-50 mt-1 w-full min-w-max overflow-y-auto rounded-[10px] border border-border bg-surface-2 p-1',
            'max-h-72 shadow-[0_8px_28px_rgba(0,0,0,0.45)] animate-fade-up',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {!hasOptions ? (
            <li className="px-2.5 py-2 text-[11.5px] text-text-muted">No options available</li>
          ) : (
            flatItems.map((item, i) => {
              if (item.kind === 'header') {
                return (
                  <li
                    key={`hdr-${item.label}`}
                    role="presentation"
                    className={cn(
                      'px-2.5 pb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-text-muted',
                      i === 0 ? 'pt-1' : 'mt-1 border-t border-border-subtle pt-2.5',
                    )}
                  >
                    {item.label}
                  </li>
                );
              }

              const opt = item.option;
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;

              return (
                <li
                  key={opt.value}
                  id={`${baseId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => selectAt(i)}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] transition-colors',
                    opt.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                    isActive && !opt.disabled && 'bg-surface-3',
                    isSelected ? 'text-accent-bright' : 'text-text-secondary',
                  )}
                >
                  <Check
                    className={cn(
                      'h-3.5 w-3.5 shrink-0 text-accent-bright',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono font-medium">{opt.label}</span>
                  {opt.hint && (
                    <span className="shrink-0 font-mono text-[10.5px] text-text-muted">{opt.hint}</span>
                  )}
                  {opt.warning && (
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] font-semibold text-[#F87171]">
                      <AlertTriangle className="h-3 w-3" />
                      {opt.warning}
                    </span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
