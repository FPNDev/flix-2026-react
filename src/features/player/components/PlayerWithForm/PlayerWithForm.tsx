import { lazy, Suspense } from 'react';
import classes from './PlayerWithForm.module.scss';
import { MediaFilesProvider } from '../../context/MediaFilesProvider';

const LazyPlayerProvider = lazy(() => import('../../context/PlayerProvider'));
const LazyPlayer = lazy(() => import('../Player/Player'));
const LazyMagnetForm = lazy(() => import('../MagnetForm/MagnetForm'));

export function PlayerWithForm() {
  return (
    <div className={classes.container}>
      <Suspense fallback={'Loading...'}>
        <MediaFilesProvider>
          <LazyPlayerProvider>
            <LazyPlayer />
            <LazyMagnetForm />
          </LazyPlayerProvider>
        </MediaFilesProvider>
      </Suspense>
    </div>
  );
}
