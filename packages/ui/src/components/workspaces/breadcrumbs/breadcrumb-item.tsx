import { cn } from '@colanode/ui/lib/utils';

interface BreadcrumbItemProps {
  icon: (className: string) => React.ReactNode;
  name: string;
  className?: string;
}

export const BreadcrumbItem = ({
  icon,
  name,
  className,
}: BreadcrumbItemProps) => {
  return (
    <div
      className={cn(
        'text-muted-foreground flex items-center space-x-2 hover:text-foreground cursor-pointer text-sm',
        className
      )}
    >
      {icon('size-4')}
      <span>{name}</span>
    </div>
  );
};
