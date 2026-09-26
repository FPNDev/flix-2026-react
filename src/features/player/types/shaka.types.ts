import type shaka from 'shaka-player';

export type ShakaPlayerConfig = DeepPartial<shaka.extern.PlayerConfiguration>;
export type ShakaRetryParameters = Partial<shaka.extern.RetryParameters>;
