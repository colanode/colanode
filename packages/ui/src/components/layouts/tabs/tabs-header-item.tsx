import { eq, useLiveQuery } from '@tanstack/react-db';
import { X } from 'lucide-react';
import { useMemo } from 'react';

import { collections } from '@colanode/ui/collections';
import { useTabManager } from '@colanode/ui/contexts/tab-manager';
import { cn } from '@colanode/ui/lib/utils';

interface TabsHeaderItemProps {
  id: string;
  index: number;
  isLast: boolean;
  isActive: boolean;
  canDelete: boolean;
}

export const TabsHeaderItem = ({
  id,
  index,
  isLast,
  isActive,
  canDelete,
}: TabsHeaderItemProps) => {
  const tabManager = useTabManager();

  const tabQuery = useLiveQuery(
    (q) =>
      q
        .from({ tabs: collections.tabs })
        .where(({ tabs }) => eq(tabs.id, id))
        .select(({ tabs }) => ({
          location: tabs.location,
        })),
    [id]
  );

  const location = tabQuery.data[0]!.location;

  const tabComponent = useMemo(() => {
    const router = tabManager.getRouter(id);
    const matches = router.matchRoutes(location);
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      if (match?.context && 'tab' in match.context) {
        return match.context.tab;
      }
    }

    return null;
  }, [id, location]);

  return (
    <div
      className={cn(
        'relative group/tab app-no-drag-region flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-200 min-w-[120px] max-w-[240px] flex-1',
        isActive
          ? 'bg-background text-foreground z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.05)] border-t border-l border-r border-border'
          : 'bg-sidebar-accent/60 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground z-10 hover:z-15 shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
        index > 0 && '-ml-3',
        `relative`
      )}
      style={{
        clipPath: isActive
          ? 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 100%, 0% 100%)'
          : 'polygon(12px 0%, calc(100% - 12px) 0%, calc(100% - 6px) 100%, 6px 100%)',
      }}
      onClick={() => tabManager.switchTab(id)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 z-10">
        <div className="truncate text-sm font-medium">
          {tabComponent || 'New tab'}
        </div>
        {canDelete && (
          <button
            className={cn(
              'opacity-0 group-hover/tab:opacity-100 transition-all duration-200 shrink-0 rounded-full p-1 hover:bg-destructive/20 hover:text-destructive',
              isActive && 'opacity-70 hover:opacity-100',
              'ml-auto'
            )}
            onClick={(e) => {
              e.stopPropagation();
              tabManager.deleteTab(id);
            }}
            title="Close tab"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {!isActive && !isLast && (
        <div className="absolute right-0 top-2 bottom-2 w-px bg-border/50" />
      )}
    </div>
  );
};
