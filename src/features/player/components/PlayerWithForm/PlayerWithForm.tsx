import { lazy, Suspense } from 'react';
import classes from './PlayerWithForm.module.scss';
import { MediaFilesProvider } from '../../context/MediaFilesProvider';

const LazyPlayerProvider = lazy(() => import('../../context/PlayerProvider'));
const LazyPlayer = lazy(() => import('../Player/Player'));
const LazySourceForm = lazy(() => import('../SourceForm/SourceForm'));

export function PlayerWithForm() {
  return (
    <div className={classes.container}>
      <Suspense fallback={'Loading...'}>
        <MediaFilesProvider>
          <LazyPlayerProvider>
            <LazyPlayer />
            <LazySourceForm />
          </LazyPlayerProvider>
        </MediaFilesProvider>
      </Suspense>
    </div>
  );
}
