import { createContext, useContext } from 'react';
import type { ToastInfo, ToastState } from './Toast.types';
import { useContextOrThrow } from '@/utils/context';

type ToastDispatchFn<T extends ToastInfo = ToastInfo, R = T> = (toast: T) => R;

type ToastDispatch = {
  addToast: ToastDispatchFn;
  markForRemoval: ToastDispatchFn<ToastState, void>;
  removeToast: ToastDispatchFn<ToastState, void>;

  clearRemovalTimeout: ToastDispatchFn<ToastState, void>;
  startRemovalTimeout: ToastDispatchFn<ToastState, void>;
};

export const ToastDispatchContext = createContext<ToastDispatch | null>(null);
export const ToastStatesContext = createContext<ToastState[]>([]);

export const useToast = () =>
  useContextOrThrow(
    ToastDispatchContext,
    'useToast called outside of ToastProvider',
  );
export const useToastStates = () => useContext(ToastStatesContext);
