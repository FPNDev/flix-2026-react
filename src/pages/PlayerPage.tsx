import { lazy, Suspense } from 'react';

const LazyPlayerWithForm = lazy(
  () => import('@/features/player/components/PlayerWithForm'),
);

export function PlayerPage() {
  return (
    <Suspense fallback={'is loading'}>
      <LazyPlayerWithForm />
    </Suspense>
  );
}
