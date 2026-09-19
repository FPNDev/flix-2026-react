import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const FullscreenPortal = ({ children }: React.PropsWithChildren) => {
  const [fullscreenElement, setFullscreenElement] = useState<Element | null>(
    null,
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenElement(document.fullscreenElement);
    };
    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (fullscreenElement) {
    return createPortal(children, fullscreenElement);
  }

  return <>{children}</>;
};
