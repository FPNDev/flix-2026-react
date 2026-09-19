import { FullscreenPortal } from './components/DesignSystem/FullscreenPortal';
import { ToastContainer, ToastProvider } from './components/DesignSystem/Toast';
import classes from './App.module.scss';
import { Player } from './features/player/components/Player';

function App() {
  return (
    <ToastProvider>
      <FullscreenPortal>
        <ToastContainer />
      </FullscreenPortal>
      <div className={classes.page}>
        <Player />
      </div>
    </ToastProvider>
  );
}

export default App;
