import classes from './ToastContainer.module.scss';
import { Toast } from './Toast';
import { useToastStates } from './ToastContext';

type Props = {
  offset: string;
};

export function ToastContainer({ offset }: Props) {
  const toasts = useToastStates();

  return (
    <div
      className={classes.toastStack}
      style={{
        '--toast-block-offset': offset,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
