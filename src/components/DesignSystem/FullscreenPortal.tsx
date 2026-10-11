import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { getFullscreenElement, subscribeFullscreen } from '@/utils/fullscreen';

export const FullscreenPortal = ({ children }: React.PropsWithChildren) => {
  const fullscreenElement = useSyncExternalStore(
    subscribeFullscreen,
    getFullscreenElement,
  );

  if (fullscreenElement) {
    return createPortal(children, fullscreenElement);
  }

  return children;
};
