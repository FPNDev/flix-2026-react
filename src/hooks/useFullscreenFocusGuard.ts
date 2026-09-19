import { useEffect } from 'react';

export const useFullscreenFocusGuard = () => {
  useEffect(() => {
    const handleFocusOut = () => {
      const fsElement = document.fullscreenElement;
      if (fsElement && !fsElement.contains(document.activeElement)) {
        (fsElement as HTMLElement).focus();
      }
    };
    window.addEventListener('focusout', handleFocusOut, { capture: true });

    return () => {
      window.removeEventListener('focusout', handleFocusOut, { capture: true });
    };
  }, []);
};
