import clsx from 'clsx';
import classes from './SourceForm.module.scss';
import { Icon } from '@/components/DesignSystem/Icon';
import { useToast } from '@/components/DesignSystem/Toast';
import { usePlayerActions, usePlayerState } from '../../context/PlayerContext';
import { isShakaActive } from '../../utils/shaka';
import { useRef } from 'react';
import { TrackSelectors } from '../TrackSelectors';

export function SourceForm() {
  const { addToast } = useToast();
  const { playFromURL, focusPlayer } = usePlayerActions();
  const { activeURI, player, isLoading, files, selectedFileIndex } =
    usePlayerState();

  const sourceInputRef = useRef<HTMLInputElement>(null);

  const submitForm = (ev: React.SubmitEvent) => {
    ev.preventDefault();

    const sourceInput = sourceInputRef.current;
    if (!sourceInput) {
      return;
    }

    focusPlayer();

    const sourceURI = sourceInput.value;

    if (
      activeURI === sourceURI &&
      ((player && isShakaActive(player)) || isLoading)
    ) {
      const fileName = files.length ? files[selectedFileIndex].name : sourceURI;
      addToast({
        icon: 'playlist_remove',
        text: `Already playing ` + fileName,
        variant: 'danger',
      });
      return;
    }

    playFromURL(sourceURI);
  };

  return (
    <form
      className={clsx(classes.controlForm, 't-body-lg')}
      onSubmit={submitForm}
    >
      <input
        name="sourceURI"
        placeholder="Source URI"
        autoFocus
        ref={sourceInputRef}
      />
      <TrackSelectors />
      <button className="btn btn--lg btn--primary">
        <Icon as="span" icon="play_arrow" size="xl" variant="fill" />
      </button>
    </form>
  );
}

export default SourceForm;
