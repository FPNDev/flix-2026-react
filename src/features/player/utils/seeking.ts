type SeekFrameByFrameParams = {
  video: HTMLVideoElement;
  direction: -1 | 1;
  frameRate: number;
};

export function seekFrameByFrame({
  video,
  direction,
  frameRate,
}: SeekFrameByFrameParams) {
  if (!video.duration || !frameRate) {
    return;
  }
  if (!video.paused) {
    video.pause();
  }

  video.currentTime += direction / frameRate;
}
