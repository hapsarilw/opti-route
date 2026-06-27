'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/** Icon-prefixed search input with optional clear button. */
export function SearchField({ placeholder = 'Search…', value = '', onChange, className }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const interactive = onChange !== undefined;

  return (
    <div
      className={cn(
        'flex h-8.5 items-center gap-2 rounded-lg border border-border bg-surface-0 px-3',
        interactive && 'focus-within:border-accent/60',
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      {interactive ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-none bg-transparent text-xs text-text-primary outline-none placeholder:text-text-muted"
        />
      ) : (
        <span className="truncate text-xs text-text-muted">{value || placeholder}</span>
      )}
      {interactive && value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          className="flex items-center text-text-muted hover:text-text-secondary"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
