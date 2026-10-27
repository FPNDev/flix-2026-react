import shaka from 'shaka-player';
import { serverError, VideoError, VideoErrorCode } from '../videoError';

const { Category, Code } = shaka.util.Error;

const CODE_ERRORS = new Map<number, VideoErrorCode>([
  [Code.LOAD_INTERRUPTED, VideoErrorCode.Interrupted],
  [Code.OPERATION_ABORTED, VideoErrorCode.Interrupted],
  [Code.TIMEOUT, VideoErrorCode.Timeout],
  [Code.CONTENT_UNSUPPORTED_BY_BROWSER, VideoErrorCode.UnsupportedCodec],
  [Code.RESTRICTIONS_CANNOT_BE_MET, VideoErrorCode.UnsupportedCodec],
  [Code.MEDIA_SOURCE_OPERATION_FAILED, VideoErrorCode.MediaSource],
  [Code.MEDIA_SOURCE_OPERATION_THREW, VideoErrorCode.MediaSource],
  [Code.QUOTA_EXCEEDED_ERROR, VideoErrorCode.MediaSource],
  [Code.STREAMING_NOT_ALLOWED, VideoErrorCode.MediaSource],
]);

const CATEGORY_ERRORS = new Map<number, VideoErrorCode>([
  [Category.NETWORK, VideoErrorCode.Network],
  [Category.TEXT, VideoErrorCode.Subtitles],
  [Category.MEDIA, VideoErrorCode.Decode],
  [Category.MANIFEST, VideoErrorCode.Manifest],
]);

const MEDIA_ERRORS = new Map<unknown, VideoErrorCode>([
  [MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, VideoErrorCode.UnsupportedCodec],
  [MediaError.MEDIA_ERR_NETWORK, VideoErrorCode.Network],
]);

function errorCode({ code, category, data }: shaka.extern.Error) {
  if (code === Code.VIDEO_ERROR) {
    return MEDIA_ERRORS.get(data[0]) ?? VideoErrorCode.Decode;
  }

  return (
    CODE_ERRORS.get(code) ??
    CATEGORY_ERRORS.get(category) ??
    VideoErrorCode.Other
  );
}

export function toVideoError(error: unknown, fatal: boolean): VideoError {
  if (!(error instanceof shaka.util.Error)) {
    return new VideoError(VideoErrorCode.Other, { fatal, cause: error });
  }

  const shakaError: shaka.extern.Error = error;
  if (shakaError.code === Code.BAD_HTTP_STATUS) {
    const status: unknown = shakaError.data[1];
    const responseText: unknown = shakaError.data[2];

    return serverError(
      Number(status),
      typeof responseText === 'string' ? responseText : '',
      { fatal, cause: error },
    );
  }

  return new VideoError(errorCode(shakaError), { fatal, cause: error });
}

export function isClientError(error: unknown): boolean {
  if (!(error instanceof shaka.util.Error)) {
    return false;
  }

  const shakaError: shaka.extern.Error = error;
  const status: unknown = shakaError.data[1];

  return (
    shakaError.code === Code.BAD_HTTP_STATUS &&
    typeof status === 'number' &&
    status >= 400 &&
    status < 500
  );
}
