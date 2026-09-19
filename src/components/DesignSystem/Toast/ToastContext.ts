import { createContext, useContext } from 'react';
import type { ToastInfo, ToastState } from './Toast.types';

type ToastDispatchFn<T extends ToastInfo = ToastInfo, R = T> = (toast: T) => R;

export const ToastDispatchContext = createContext<{
  addToast: ToastDispatchFn;
  markForRemoval: ToastDispatchFn<ToastState, void>;
  removeToast: ToastDispatchFn<ToastState, void>;

  clearRemovalTimeout: ToastDispatchFn<ToastState, void>;
  startRemovalTimeout: ToastDispatchFn<ToastState, void>;
}>({
  addToast: (toast) => toast,
  markForRemoval: () => {},
  removeToast: () => {},

  clearRemovalTimeout: () => {},
  startRemovalTimeout: () => {},
});

export const ToastStatesContext = createContext<ToastState[]>([]);

export const useToast = () => useContext(ToastDispatchContext);
export const useToastStates = () => useContext(ToastStatesContext);
