import { Suspense } from 'react';
import { ManifestsView } from '@/features/manifests';

// Suspense required because ManifestsView is a client component (Next.js App Router).
export default function ManifestsPage() {
  return (
    <Suspense>
      <ManifestsView />
    </Suspense>
  );
}
