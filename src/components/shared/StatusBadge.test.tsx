import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { MANIFEST_STATUSES } from '@/types';
import { STATUS_CONFIG } from '@/config/status';

/**
 * Component — StatusBadge render per status (SDD §13).
 * Verifies every one of the 9 statuses renders its label, and that the two
 * animated states (OPTIMIZING pulse, EXCEPTION flash) carry their classes.
 */
describe('StatusBadge', () => {
  it('renders a label for all 9 manifest statuses', () => {
    for (const status of MANIFEST_STATUSES) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
      unmount();
    }
  });

  it('flashes the EXCEPTION badge (animate-flash)', () => {
    render(<StatusBadge status="EXCEPTION" />);
    const badge = screen.getByText(STATUS_CONFIG.EXCEPTION.label);
    expect(badge).toHaveClass('animate-flash');
  });

  it('pulses the OPTIMIZING status LED (animate-pulse)', () => {
    const { container } = render(<StatusBadge status="OPTIMIZING" />);
    const led = container.querySelector('.animate-pulse');
    expect(led).not.toBeNull();
  });

  it('does not flash a calm status like QUEUED', () => {
    render(<StatusBadge status="QUEUED" />);
    expect(screen.getByText(STATUS_CONFIG.QUEUED.label)).not.toHaveClass('animate-flash');
  });
});
