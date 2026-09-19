import type { IconType } from '@/components/DesignSystem/Icon';

// Enums

export const ToastStatus = {
  Active: 0,
  Removing: 1,
} as const;
export type ToastStatus = (typeof ToastStatus)[keyof typeof ToastStatus];

export const ToastAction = {
  Close: 0,
  Button: 1,
} as const;
export type ToastAction = (typeof ToastAction)[keyof typeof ToastAction];

// Actions

type ActionStateClose = {
  action: typeof ToastAction.Close;
};

type ActionStateButton = {
  action: typeof ToastAction.Button;
  btnText: string;
  onAction: (toast: ToastState) => unknown;
};

type ActionStateNone = {
  action?: never;
};

// Union interfaces

type BaseToastInfo = {
  icon: IconType;
  text: string;
  variant?: 'success' | 'danger' | 'accent';
  duration?: number;
};

export type ToastInfo = BaseToastInfo &
  (ActionStateButton | ActionStateClose | ActionStateNone);

export type ToastState = ToastInfo & {
  id: number;
  status: ToastStatus;
  variant: NonNullable<ToastInfo['variant']>;
};
