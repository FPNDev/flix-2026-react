import { VideoError, VideoErrorCode } from './videoError';

const CHECK_INTERVAL_MS = 1_000;
const STALL_TIMEOUT_MS = 10_000;
const MIN_BUFFER_AHEAD_S = 1;

function hasBufferAhead(video: HTMLVideoElement): boolean {
  const { buffered, currentTime } = video;
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) > currentTime) {
      return false;
    }
    if (buffered.end(i) - currentTime >= MIN_BUFFER_AHEAD_S) {
      return true;
    }
  }

  return false;
}

export function createStallWatchdog(video: HTMLVideoElement) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastTime = 0;
  let stuckSince = 0;
  let fired = false;
  let resume: AbortController | undefined;

  const check = () => {
    const now = performance.now();
    const { currentTime } = video;

    if (currentTime !== lastTime) {
      lastTime = currentTime;
      stuckSince = now;
      fired = false;

      return;
    }

    if (
      video.paused ||
      video.seeking ||
      video.ended ||
      !hasBufferAhead(video)
    ) {
      stuckSince = now;

      return;
    }

    if (!fired && now - stuckSince >= STALL_TIMEOUT_MS) {
      fired = true;
      video.dispatchEvent(
        new CustomEvent('sdk:error', {
          detail: new VideoError(VideoErrorCode.Stalled, { fatal: false }),
        }),
      );
    }
  };

  const stop = () => {
    resume?.abort();
    resume = undefined;
    clearInterval(timer);
    timer = undefined;
  };

  const start = () => {
    lastTime = video.currentTime;
    stuckSince = performance.now();
    fired = false;
    timer = setInterval(check, CHECK_INTERVAL_MS);
  };

  const stopUntilPlaying = () => {
    stop();
    resume = new AbortController();
    video.addEventListener('playing', start, {
      once: true,
      signal: resume.signal,
    });
  };

  return { start, stop, stopUntilPlaying };
}
