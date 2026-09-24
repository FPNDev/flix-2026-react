import { FullscreenPortal } from './components/DesignSystem/FullscreenPortal';
import { ToastContainer, ToastProvider } from './components/DesignSystem/Toast';
import classes from './App.module.scss';
import { setMediaSessionMetadata } from './features/player/utils/media-session';
import { Outlet } from 'react-router';

setMediaSessionMetadata('FLIX');

function App() {
  return (
    <ToastProvider>
      <FullscreenPortal>
        <ToastContainer />
      </FullscreenPortal>
      <div className={classes.page}>
        <Outlet />
      </div>
    </ToastProvider>
  );
}

export default App;
