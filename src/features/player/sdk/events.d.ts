import type { VideoError } from './videoError';

declare global {
  interface HTMLMediaElementEventMap {
    'sdk:error': CustomEvent<VideoError>;
  }
}
