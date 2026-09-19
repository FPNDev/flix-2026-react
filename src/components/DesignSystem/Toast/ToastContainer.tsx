import classes from './ToastContainer.module.scss';
import { Toast } from './Toast';
import { useToastStates } from './ToastContext';

export function ToastContainer() {
  const toasts = useToastStates();

  return (
    <div className={classes.toastStack}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
