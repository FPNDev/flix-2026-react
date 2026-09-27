interface Element {
  webkitRequestFullscreen?(): Promise<void>;
  msRequestFullscreen?(): Promise<void>;

  webkitExitFullscreen?(): Promise<void>;
}

interface Document {
  webkitExitFullscreen?(): Promise<void>;
  msExitFullscreen?(): Promise<void>;

  webkitFullscreenElement?: Element;
  msFullscreenElement?: Element;
}
