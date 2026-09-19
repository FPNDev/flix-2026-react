import type { PropsWithAs } from '@/types/utils';
import clsx from 'clsx';
import classes from './Container.module.scss';

type Props<T extends React.ElementType> = React.PropsWithChildren<
  PropsWithAs<
    {
      narrow?: boolean;
    },
    T
  >
>;

export function Container<T extends React.ElementType = 'div'>({
  as,
  narrow,
  className,
  ...props
}: Props<T>) {
  const Component = as || 'div';
  const classNameBuilt = clsx(className, [
    classes.container,
    ...(narrow ? [classes.narrow] : []),
  ]);
  return (
    <Component
      className={classNameBuilt}
      {...(props as React.ComponentProps<T>)}
    />
  );
}
