import { useIsMobile } from '@colanode/ui/hooks/use-is-mobile';
import { cn } from '@colanode/ui/lib/utils';

interface SidebarHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const SidebarHeader = ({ title, actions }: SidebarHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex items-center justify-between h-12 pl-2 pr-1 app-drag-region">
      <p className="font-bold text-muted-foreground flex-grow app-no-drag-region">
        {title}
      </p>
      {actions && (
        <div
          className={cn(
            'text-muted-foreground flex items-center justify-center app-no-drag-region',
            !isMobile &&
              'opacity-0 group-hover/sidebar:opacity-100 transition-opacity'
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
