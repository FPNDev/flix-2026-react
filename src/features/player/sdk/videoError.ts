export const VideoErrorCode = {
  Interrupted: 'Interrupted',
  UnsupportedBrowser: 'UnsupportedBrowser',
  UnsupportedCodec: 'UnsupportedCodec',
  Network: 'Network',
  Timeout: 'Timeout',
  Server: 'Server',
  Manifest: 'Manifest',
  Decode: 'Decode',
  MediaSource: 'MediaSource',
  Stalled: 'Stalled',
  Subtitles: 'Subtitles',
  Storage: 'Storage',
  AutoplayBlocked: 'AutoplayBlocked',
  Other: 'Other',
} as const;
export type VideoErrorCode =
  (typeof VideoErrorCode)[keyof typeof VideoErrorCode];

type VideoErrorOptions = ErrorOptions & {
  fatal?: boolean;
  status?: number;
  serverMessage?: string;
};

export class VideoError extends Error {
  override readonly name = 'VideoError';
  readonly code: VideoErrorCode;
  readonly fatal: boolean;
  readonly status?: number;
  readonly serverMessage?: string;

  constructor(
    code: VideoErrorCode,
    { fatal = true, status, serverMessage, ...options }: VideoErrorOptions = {},
  ) {
    super(code, options);
    this.code = code;
    this.fatal = fatal;
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

const SILENT_PLAY_ERRORS = new Set(['NotAllowedError', 'AbortError']);

export async function playVideo(video: HTMLMediaElement) {
  try {
    await video.play();
  } catch (error) {
    if (!(
      error instanceof DOMException && SILENT_PLAY_ERRORS.has(error.name)
    )) {
      throw error;
    }
  }
}

export function serverError(
  status: number,
  body: string,
  options?: Pick<VideoErrorOptions, 'fatal' | 'cause'>,
): VideoError {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    // no data can be parsed
  }

  const serverMessage =
    typeof json === 'object' &&
    json !== null &&
    'error' in json &&
    typeof json.error === 'string'
      ? json.error
      : undefined;

  return new VideoError(VideoErrorCode.Server, {
    ...options,
    status,
    serverMessage,
  });
}
