import classes from './PlayerWithForm.module.scss';
import { MediaFilesProvider } from '../../context/MediaFilesProvider';
import PlayerProvider from '../../context/PlayerProvider';
import Player from '../Player/Player';
import { MagnetForm } from '../MagnetForm';

export function PlayerWithForm() {
  return (
    <div className={classes.container}>
      <MediaFilesProvider>
        <PlayerProvider>
          <Player />
          <MagnetForm />
        </PlayerProvider>
      </MediaFilesProvider>
    </div>
  );
}
