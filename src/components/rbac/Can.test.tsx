import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Can } from './Can';
import { useAuthStore } from '@/stores/auth-store';
import type { Role } from '@/types';

const setRole = (role: Role) => useAuthStore.getState().setRole(role);

/**
 * Component — <Can> conditional render per role (SDD §13 / Doc 01 §4 RBAC matrix).
 * Drives the in-memory auth store through each role and asserts the gated child
 * renders only when that role holds the permission.
 */
describe('<Can> RBAC gate', () => {
  beforeEach(() => setRole('dispatcher'));

  it('admin sees every gated action', () => {
    setRole('admin');
    render(
      <>
        <Can permission="manifest:delete"><span>delete</span></Can>
        <Can permission="config:tariff:write"><span>edit-tariff</span></Can>
        <Can permission="route:optimize"><span>optimize</span></Can>
        <Can permission="route:dispatch"><span>dispatch</span></Can>
      </>,
    );
    expect(screen.getByText('delete')).toBeInTheDocument();
    expect(screen.getByText('edit-tariff')).toBeInTheDocument();
    expect(screen.getByText('optimize')).toBeInTheDocument();
    expect(screen.getByText('dispatch')).toBeInTheDocument();
  });

  it('dispatcher can optimize + dispatch but NOT delete or edit tariff', () => {
    setRole('dispatcher');
    render(
      <>
        <Can permission="route:optimize"><span>optimize</span></Can>
        <Can permission="route:dispatch"><span>dispatch</span></Can>
        <Can permission="manifest:delete"><span>delete</span></Can>
        <Can permission="config:tariff:write"><span>edit-tariff</span></Can>
      </>,
    );
    expect(screen.getByText('optimize')).toBeInTheDocument();
    expect(screen.getByText('dispatch')).toBeInTheDocument();
    expect(screen.queryByText('delete')).not.toBeInTheDocument();
    expect(screen.queryByText('edit-tariff')).not.toBeInTheDocument();
  });

  it('manager can read tariff but NOT optimize, dispatch, or write tariff', () => {
    setRole('manager');
    render(
      <>
        <Can permission="config:tariff:read"><span>view-tariff</span></Can>
        <Can permission="config:tariff:write"><span>edit-tariff</span></Can>
        <Can permission="route:optimize"><span>optimize</span></Can>
        <Can permission="route:dispatch"><span>dispatch</span></Can>
      </>,
    );
    expect(screen.getByText('view-tariff')).toBeInTheDocument();
    expect(screen.queryByText('edit-tariff')).not.toBeInTheDocument();
    expect(screen.queryByText('optimize')).not.toBeInTheDocument();
    expect(screen.queryByText('dispatch')).not.toBeInTheDocument();
  });

  it('renders the fallback when the permission is absent', () => {
    setRole('manager');
    render(
      <Can permission="route:dispatch" fallback={<span>no-access</span>}>
        <span>dispatch</span>
      </Can>,
    );
    expect(screen.getByText('no-access')).toBeInTheDocument();
    expect(screen.queryByText('dispatch')).not.toBeInTheDocument();
  });
});
