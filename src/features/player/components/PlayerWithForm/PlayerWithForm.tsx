import { lazy, Suspense } from 'react';
import classes from './PlayerWithForm.module.scss';

const LazyPlayerProvider = lazy(() => import('../../context/PlayerProvider'));
const LazyPlayer = lazy(() => import('../Player/Player'));
const LazySourceForm = lazy(() => import('../SourceForm/SourceForm'));

export function PlayerWithForm() {
  return (
    <div className={classes.container}>
      <Suspense fallback={'Loading...'}>
        <LazyPlayerProvider>
          <LazyPlayer />
          <LazySourceForm />
        </LazyPlayerProvider>
      </Suspense>
    </div>
  );
}
