/**
 * Add keyUp listener that only fires if it's keyDown was fired under target
 *
 * @param target Element within which to listen for keyUp
 * @param listenerFn Callback to be invoked on keyUp
 * @returns Function that removes the listener
 */
export function addExclusiveKeyUpListener(
  target: HTMLElement,
  listenerFn: (ev: KeyboardEvent) => boolean | void,
) {
  const keydownOnTarget = new Map<string, boolean>();

  const onKeyDown = (ev: KeyboardEvent) => {
    if (!keydownOnTarget.has(ev.code)) {
      keydownOnTarget.set(
        ev.code,
        ev.target === target || target.contains(ev.target as Node),
      );
    }
  };

  const onKeyUp = (ev: KeyboardEvent) => {
    const { code } = ev;

    const isKeydownOnTarget = keydownOnTarget.get(code);
    keydownOnTarget.delete(code);

    if (!isKeydownOnTarget) {
      return;
    }

    return listenerFn(ev);
  };

  const onWindowBlur = () => {
    keydownOnTarget.clear();
  };

  target.addEventListener('keyup', onKeyUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('blur', onWindowBlur);

  return () => {
    target.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('blur', onWindowBlur);
  };
}
