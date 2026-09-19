export function requestFullscreen(element: Element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

export function exitFullscreen(element?: Element) {
  if (element?.webkitExitFullscreen) {
    element.webkitExitFullscreen();
  }

  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

export function toggleFullscreen(element: Element) {
  return isFullscreen(element)
    ? exitFullscreen(element)
    : requestFullscreen(element);
}

export function isFullscreen(element?: Element) {
  const fullscreenElement =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement;

  return element ? fullscreenElement === element : !!fullscreenElement;
}
