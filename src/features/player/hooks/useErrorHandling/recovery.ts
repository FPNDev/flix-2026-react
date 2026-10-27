import type { IconType } from '@/components/DesignSystem/Icon';
import { formatTime } from '@/utils/time';
import { VideoErrorCode, type VideoError } from '../../sdk';

type Bucket = 'connection' | 'decode' | 'stall' | 'other';

type Spot = Record<Bucket, number> & {
  time: number;
};

export type Session = {
  controller: AbortController;
  spot: Spot | null;
  subtitlesWarned: Set<number>;
  recovering: boolean;
};

type RetryWait = number | 'online';

type RecoveryPlan = {
  startTime: number;
  wait: RetryWait;
};

type PlanRecoveryParams = {
  session: Session;
  error: VideoError;
  time: number;
  fileLabel: string;
  showError: (text: string, icon: IconType) => void;
};

const RELOAD_LIMITS: Record<Bucket, number> = {
  connection: 3,
  decode: 2,
  stall: 2,
  other: 1,
};

const CONNECTION_BACKOFF_MS = 2000;
const DECODE_SKIP_S = 1;
const SPOT_WINDOW_S = 5;

export function waitForRetry(wait: RetryWait, signal: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    const onAbort = () => {
      clearTimeout(timer);
      resolve(false);
    };
    const resume = () => {
      signal.removeEventListener('abort', onAbort);
      resolve(true);
    };
    const timer = wait === 'online' ? undefined : setTimeout(resume, wait);

    if (wait === 'online') {
      window.addEventListener('online', resume, { once: true, signal });
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function getSpot(session: Session, time: number) {
  if (session.spot && Math.abs(time - session.spot.time) <= SPOT_WINDOW_S) {
    return session.spot;
  }

  session.spot = { time, connection: 0, decode: 0, stall: 0, other: 0 };

  return session.spot;
}

function planRetry(
  session: Session,
  time: number,
  bucket: Bucket,
  giveUp: (spotTime: number) => void,
): RecoveryPlan | undefined {
  const spot = getSpot(session, time);
  const attempt = spot[bucket];

  if (attempt >= RELOAD_LIMITS[bucket]) {
    giveUp(spot.time);

    return;
  }

  spot[bucket] = attempt + 1;

  if (bucket === 'connection') {
    return {
      startTime: spot.time,
      wait: CONNECTION_BACKOFF_MS * 2 ** attempt,
    };
  }

  const skip = bucket === 'decode' ? attempt * DECODE_SKIP_S : 0;

  return { startTime: spot.time + skip, wait: 0 };
}

export function planRecovery({
  session,
  error,
  time,
  fileLabel,
  showError,
}: PlanRecoveryParams): RecoveryPlan | undefined {
  switch (error.code) {
    case VideoErrorCode.Interrupted:
    case VideoErrorCode.AutoplayBlocked:
    case VideoErrorCode.UnsupportedBrowser:
    case VideoErrorCode.Subtitles:
    case VideoErrorCode.Storage:
      return;
    case VideoErrorCode.UnsupportedCodec:
      showError(
        'Video codec is not supported by your browser',
        'play_disabled',
      );

      return;
    case VideoErrorCode.Manifest:
      showError(`Cannot play ${fileLabel}`, 'play_disabled');

      return;
    case VideoErrorCode.Network:
    case VideoErrorCode.Timeout:
      if (!navigator.onLine) {
        return { startTime: getSpot(session, time).time, wait: 'online' };
      }

      return planRetry(session, time, 'connection', () => {
        showError('Connection lost', 'wifi_off');
      });
    case VideoErrorCode.Server: {
      const text = error.serverMessage ?? `Server error ${error.status}`;
      if (error.status !== undefined && error.status >= 500) {
        return planRetry(session, time, 'connection', () => {
          showError(text, 'cloud_off');
        });
      }

      showError(text, 'cloud_off');

      return;
    }
    case VideoErrorCode.Decode:
    case VideoErrorCode.MediaSource:
      return planRetry(session, time, 'decode', (spotTime) => {
        showError(`Playback failed at ${formatTime(spotTime)}`, 'error');
      });
    case VideoErrorCode.Stalled:
      return planRetry(session, time, 'stall', (spotTime) => {
        showError(`Playback stalled at ${formatTime(spotTime)}`, 'error');
      });
    case VideoErrorCode.Other:
      return planRetry(session, time, 'other', () => {
        console.error(error.cause);
        showError('Playback error', 'error');
      });
  }
}
