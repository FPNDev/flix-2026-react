import type { PropsWithAs } from '@/types/utils.types';
import clsx from 'clsx';
import classes from './Group.module.scss';
import type { Spacing } from './Layout.types';

export type GroupProps<T extends React.ElementType> = React.PropsWithChildren<
  PropsWithAs<
    {
      equal?: boolean;
      spacing?: Spacing;
      variant: 'row' | 'stack';
    },
    T
  >
>;

export function Group<T extends React.ElementType = 'div'>({
  as,
  equal,
  spacing,
  variant,
  className,
  ...props
}: GroupProps<T>) {
  const Component = as || 'div';
  const classNameBuilt = clsx(className, [
    classes.group,
    classes[variant],
    ...(spacing ? [classes[`sp-${spacing}`]] : []),
    ...(equal ? [classes.equal] : []),
  ]);
  return (
    <Component
      className={classNameBuilt}
      {...(props as React.ComponentProps<T>)}
    />
  );
}
