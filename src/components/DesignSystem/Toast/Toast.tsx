import clsx from 'clsx';
import classes from './Toast.module.scss';
import { useEffect } from 'react';
import { ToastAction, ToastStatus, type ToastState } from './Toast.types';
import { Icon } from '@/components/DesignSystem/Icon';
import { useToast } from './ToastContext';

type Props = {
  toast: ToastState;
};

export function Toast({ toast }: Props) {
  const {
    markForRemoval,
    removeToast,
    clearRemovalTimeout,
    startRemovalTimeout,
  } = useToast();

  const isRemoving = toast.status === ToastStatus.Removing;

  useEffect(() => {
    const onWindowBlur = () => {
      startRemovalTimeout(toast);
    };
    window.addEventListener('blur', onWindowBlur);

    return () => {
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [toast, startRemovalTimeout]);

  return (
    <div
      className={clsx(
        classes.toast,
        {
          [classes.removing]: isRemoving,
        },
        classes[toast.variant],
      )}
      onAnimationEnd={
        toast.status === ToastStatus.Removing
          ? () => {
              removeToast(toast);
            }
          : undefined
      }
      onPointerEnter={() => {
        clearRemovalTimeout(toast);
      }}
      onPointerLeave={() => {
        startRemovalTimeout(toast);
      }}
    >
      <Icon className={classes.icon} icon={toast.icon} />
      <div className={classes.text} role="status" aria-atomic>
        {toast.text}
      </div>
      {toast.action === ToastAction.Close && (
        <button
          className="icon-btn icon-btn--sm"
          onClick={() => {
            markForRemoval(toast);
          }}
        >
          <Icon icon={'close'} />
        </button>
      )}
      {toast.action === ToastAction.Button && (
        <button onClick={() => toast.onAction(toast)}>{toast.btnText}</button>
      )}
    </div>
  );
}
