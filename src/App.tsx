import { FullscreenPortal } from './components/DesignSystem/FullscreenPortal';
import { ToastContainer, ToastProvider } from './components/DesignSystem/Toast';
import classes from './App.module.scss';
import { PlayerWithForm } from './features/player/components/PlayerWithForm';

function App() {
  return (
    <ToastProvider>
      <FullscreenPortal>
        <ToastContainer />
      </FullscreenPortal>
      <div className={classes.page}>
        <PlayerWithForm />
      </div>
    </ToastProvider>
  );
}

export default App;
