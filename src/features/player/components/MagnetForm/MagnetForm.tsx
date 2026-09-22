import clsx from 'clsx';
import classes from './MagnetForm.module.scss';
import { Icon } from '@/components/DesignSystem/Icon';
import { useToast } from '@/components/DesignSystem/Toast';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { isShakaActive } from '../../utils/shaka';
import { useRef } from 'react';
import { TrackSelectors } from '../TrackSelectors';

export function MagnetForm() {
  const { addToast } = useToast();
  const { playFromURL, focusPlayer } = usePlayerActions();
  const { activeURI, player, isLoading, files, selectedFileIndex } =
    usePlayerState();

  const magnetInputRef = useRef<HTMLInputElement>(null);

  const submitForm = (ev: React.SubmitEvent) => {
    ev.preventDefault();

    const magnetInput = magnetInputRef.current;
    if (!magnetInput) {
      return;
    }

    focusPlayer();

    const magnetURI = magnetInput.value;

    if (
      activeURI === magnetURI &&
      ((player && isShakaActive(player)) || isLoading)
    ) {
      const fileName = files.length ? files[selectedFileIndex].name : magnetURI;
      addToast({
        icon: 'playlist_remove',
        text: `Already playing ` + fileName,
        variant: 'danger',
      });
      return;
    }

    playFromURL(magnetURI);
  };

  return (
    <form
      className={clsx(classes.controlForm, 't-body-lg')}
      onSubmit={submitForm}
    >
      <input
        name="magnetURI"
        placeholder="Magnet URI"
        autoFocus
        ref={magnetInputRef}
      />
      <TrackSelectors />
      <button className="btn btn--lg btn--primary">
        <Icon as="span" icon="play_arrow" size="xl" variant="fill" />
      </button>
    </form>
  );
}

export default MagnetForm;
