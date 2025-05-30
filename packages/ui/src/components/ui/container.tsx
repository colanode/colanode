import { cn } from '@colanode/ui/lib/utils';

export const Container = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'flex flex-col w-full h-full min-w-full min-h-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const ContainerHeader = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('flex flex-row w-full items-center gap-2 px-3', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const ContainerBody = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'px-10 py-4 flex-grow max-h-full h-full overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const ContainerSettings = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
};
