function requestFullscreen(element: Element) {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    return element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    return element.msRequestFullscreen();
  }
}

function exitFullscreen(element?: Element) {
  if (element?.webkitExitFullscreen) {
    return element.webkitExitFullscreen();
  }

  if (document.exitFullscreen) {
    return document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    return document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    return document.msExitFullscreen();
  }
}

export function toggleFullscreen(element: Element) {
  return isFullscreen(element)
    ? exitFullscreen(element)
    : requestFullscreen(element);
}

export function getFullscreenElement() {
  return (
    document.fullscreenElement ??
    document.webkitFullscreenElement ??
    document.msFullscreenElement
  );
}

function isFullscreen(element?: Element) {
  const fullscreenElement = getFullscreenElement();

  return element ? fullscreenElement === element : !!fullscreenElement;
}
