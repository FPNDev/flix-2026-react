interface Element {
  webkitRequestFullscreen?();
  msRequestFullscreen?();

  webkitExitFullscreen?();
}

interface Document {
  webkitExitFullscreen?();
  msExitFullscreen?();

  webkitFullscreenElement?: Element;
  msFullscreenElement?: Element;
}
