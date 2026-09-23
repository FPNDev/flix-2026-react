import type { PropsWithAs } from '@/types/utils.types';
import classes from './Icon.module.scss';
import clsx from 'clsx';
import type { IconType } from './Icon.types';

type Props<T extends React.ElementType> = PropsWithAs<
  {
    icon: IconType;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    variant?: 'fill' | 'fill-bold' | 'bold' | 'fill-thin' | 'thin';
  },
  T
>;

export function Icon<T extends React.ElementType = 'div'>({
  as,
  icon,
  size = 'md',
  variant,
  className,
  ...props
}: Props<T>) {
  const Component = as || 'div';
  const classNameBuilt = clsx(className, [
    classes.icon,
    classes[`s-${size}`],
    ...(variant !== undefined ? [classes[variant]] : []),
  ]);
  return (
    <Component
      className={classNameBuilt}
      {...(props as React.ComponentProps<T>)}
    >
      {icon}
    </Component>
  );
}
