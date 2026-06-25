import { NextResponse } from 'next/server';

/**
 * Route-guard scaffold for protected pages (Doc 01 §4, SDD §14).
 * Next 16 "proxy" convention (formerly middleware).
 *
 * NOTE: auth is held in-memory (Zustand, non-persisted) per CLAUDE.md, which the
 * Edge proxy cannot read. Real enforcement here needs a mock session
 * cookie/header; until then the client guard in <TariffView> + <Can> does the
 * gating. This stub keeps the protected-route surface wired and documented.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/settings/:path*'],
};
