import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useToast } from '@/components/DesignSystem/Toast';
import type { IconType } from '@/components/DesignSystem/Icon';
import { VideoError, VideoErrorCode, type VideoSdk } from '../../sdk';
import { getTrackDisplayName } from '../../utils/tracks';
import type { LoadOptions } from '../useVideoStartup';
import { planRecovery, waitForRetry, type Session } from './recovery';

type Props = {
  player: VideoSdk | undefined;
  fileName: string | undefined;
  activeURI: string;
  load: (url: string, options?: LoadOptions) => Promise<void>;
};

type Failure = {
  url: string;
  time: number;
  play?: boolean;
  initial?: boolean;
};

export function useErrorHandling({ player, fileName, activeURI, load }: Props) {
  const { addToast } = useToast();
  const sessionRef = useRef<Session>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const showError = (text: string, icon: IconType) => {
    addToast({ icon, text, variant: 'danger' });
  };

  const setRecovering = (session: Session, recovering: boolean) => {
    session.recovering = recovering;
    setIsRecovering(recovering);
  };

  const recover = async (
    session: Session,
    error: unknown,
    failure: Failure,
  ) => {
    const { signal } = session.controller;
    let reason = error;
    let time = failure.time;
    let notify = !failure.initial;

    while (!signal.aborted) {
      const plan = planRecovery({
        session,
        error:
          reason instanceof VideoError
            ? reason
            : new VideoError(VideoErrorCode.Other, { cause: reason }),
        time,
        fileLabel: fileName ?? activeURI,
        showError,
      });

      if (!plan) {
        setRecovering(session, false);
        throw reason;
      }

      setRecovering(session, true);

      if (!(await waitForRetry(plan.wait, signal))) {
        break;
      }

      if (notify) {
        notify = false;
        addToast({
          icon: 'autorenew',
          text: 'Reconnecting...',
          variant: 'accent',
        });
      }

      try {
        await load(failure.url, {
          startTime: plan.startTime,
          play: failure.play,
        });

        if (!signal.aborted) {
          setRecovering(session, false);

          return;
        }
      } catch (reloadError) {
        reason = reloadError;
        time = plan.startTime;
      }
    }

    throw new VideoError(VideoErrorCode.Interrupted);
  };

  const warnSubtitlesFailed = (session: Session, sdk: VideoSdk) => {
    const index = sdk.textTrack;
    if (session.subtitlesWarned.has(index)) {
      return;
    }

    session.subtitlesWarned.add(index);
    const track = sdk.textTracks[index];

    addToast({
      icon: 'subtitles_off',
      text: track
        ? `Subtitles ${getTrackDisplayName(track)} failed to load`
        : 'Subtitles failed to load',
      variant: 'accent',
    });
  };

  const onSdkError = useEffectEvent((sdk: VideoSdk, error: VideoError) => {
    const session = sessionRef.current;
    if (!session || session.controller.signal.aborted) {
      return;
    }

    if (error.code === VideoErrorCode.Subtitles) {
      warnSubtitlesFailed(session, sdk);

      return;
    }

    if (!error.fatal && error.code !== VideoErrorCode.Stalled) {
      console.warn(error);

      return;
    }

    if (!session.recovering) {
      recover(session, error, {
        url: activeURI,
        time: sdk.video.currentTime,
        play: !sdk.video.paused,
      }).catch(() => {});
    }
  });

  useEffect(() => {
    if (!player) {
      return;
    }

    let storageWarned = false;

    const handleSdkError = ({ detail }: CustomEvent<VideoError>) => {
      if (detail.code !== VideoErrorCode.Storage) {
        onSdkError(player, detail);
      } else if (!storageWarned) {
        storageWarned = true;
        console.warn(detail);
      }
    };

    player.video.addEventListener('sdk:error', handleSdkError);

    return () => {
      player.video.removeEventListener('sdk:error', handleSdkError);
      sessionRef.current?.controller.abort();
    };
  }, [player]);

  const loadWithRecovery = async (url: string) => {
    sessionRef.current?.controller.abort();

    const controller = new AbortController();
    controller.signal.addEventListener('abort', () => {
      setIsRecovering(false);
    });

    const session: Session = {
      controller,
      spot: null,
      subtitlesWarned: new Set(),
      recovering: false,
    };
    sessionRef.current = session;

    try {
      await load(url);
    } catch (error) {
      await recover(session, error, { url, time: 0, initial: true });
    }
  };

  return { load: loadWithRecovery, isRecovering };
}
