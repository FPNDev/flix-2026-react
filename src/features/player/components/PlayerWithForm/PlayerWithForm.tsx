import { lazy, Suspense } from 'react';
import classes from './PlayerWithForm.module.scss';

const LazyPlayerProvider = lazy(() => import('../../context/PlayerProvider'));
const LazyPlayer = lazy(() => import('../Player/Player'));
const LazyMagnetForm = lazy(() => import('../MagnetForm/MagnetForm'));

export function PlayerWithForm() {
  return (
    <div className={classes.container}>
      <Suspense fallback={'Loading...'}>
        <LazyPlayerProvider>
          <LazyPlayer />
          <LazyMagnetForm />
        </LazyPlayerProvider>
      </Suspense>
    </div>
  );
}
