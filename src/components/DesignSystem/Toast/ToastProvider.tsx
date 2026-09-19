import { useLayoutEffect, useReducer, useRef } from 'react';
import { ToastStatus, type ToastInfo, type ToastState } from './Toast.types';
import { DEFAULTS } from './Toast.constants';
import { ToastDispatchContext, ToastStatesContext } from './ToastContext';

type ToastsReducerAction =
  | {
      toast: ToastState;
      type: 'startRemoval' | 'remove';
    }
  | { toast: ToastState; type: 'add'; maxItems: number };

function toastsReducer(toasts: ToastState[], action: ToastsReducerAction) {
  switch (action.type) {
    case 'add':
      return [...toasts, action.toast].slice(-action.maxItems);
    case 'startRemoval':
      return toasts.map((toast) => {
        return toast === action.toast
          ? ({
              ...toast,
              status: ToastStatus.Removing,
            } as ToastState)
          : toast;
      });
    case 'remove':
      return toasts.filter((toast) => toast !== action.toast);
  }
}

type Props = React.PropsWithChildren<{
  maxItems?: number;
}>;

export function ToastProvider({
  children,
  maxItems = DEFAULTS.maxItems,
}: Props) {
  const toastIdRef = useRef(0);
  const [toasts, dispatch] = useReducer(toastsReducer, []);
  const timeoutMapRef = useRef<WeakMap<ToastState, number>>(null);

  useLayoutEffect(() => {
    timeoutMapRef.current = new WeakMap();
  }, []);

  const clearRemovalTimeout = (toast: ToastState) => {
    const timeoutMap = timeoutMapRef.current;
    if (toast.status !== ToastStatus.Active || !timeoutMap) {
      return;
    }

    clearTimeout(timeoutMap.get(toast));
    timeoutMap.delete(toast);
  };

  const startRemovalTimeout = (toast: ToastState) => {
    const timeoutMap = timeoutMapRef.current;
    if (
      !timeoutMap ||
      toast.status !== ToastStatus.Active ||
      timeoutMap.has(toast)
    ) {
      return;
    }

    timeoutMap.set(
      toast,
      setTimeout(() => {
        markForRemoval(toast);
      }, toast.duration ?? DEFAULTS.duration),
    );
  };

  const addToast = (baseToast: ToastInfo) => {
    const toast: ToastState = {
      ...baseToast,
      variant: baseToast.variant ?? DEFAULTS.variant,
      id: toastIdRef.current++,
      status: ToastStatus.Active,
    };

    dispatch({
      toast,
      type: 'add',
      maxItems,
    });
    startRemovalTimeout(toast);

    return toast;
  };

  const markForRemoval = (toast: ToastState) => {
    clearRemovalTimeout(toast);
    dispatch({
      toast,
      type: 'startRemoval',
    });
  };

  const removeToast = (toast: ToastState) => {
    dispatch({
      toast,
      type: 'remove',
    });
  };

  return (
    <ToastStatesContext.Provider value={toasts}>
      <ToastDispatchContext.Provider
        value={{
          addToast,
          markForRemoval,
          removeToast,
          clearRemovalTimeout,
          startRemovalTimeout,
        }}
      >
        {children}
      </ToastDispatchContext.Provider>
    </ToastStatesContext.Provider>
  );
}
