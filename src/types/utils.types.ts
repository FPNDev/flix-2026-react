export type PropsWithAs<R, T extends React.ElementType> = {
  as?: T;
} & Omit<React.ComponentProps<T>, 'as' | keyof R> &
  R;
