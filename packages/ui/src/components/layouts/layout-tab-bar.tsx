import { X } from 'lucide-react';

import { Tab } from '@colanode/client/types';
import { LayoutTabBarContent } from '@colanode/ui/components/layouts/layout-tab-bar-content';
import { cn } from '@colanode/ui/lib/utils';
import { router } from '@colanode/ui/routes';

interface LayoutTabBarProps {
  tab: Tab;
  router: typeof router;
  index: number;
  isActive: boolean;
  isLast: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export const LayoutTabBar = ({
  tab,
  router,
  index,
  isActive,
  isLast,
  onClick,
  onDelete,
}: LayoutTabBarProps) => {
  return (
    <div
      key={tab.id}
      className={cn(
        'relative group/tab app-no-drag-region flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-200 min-w-[120px] max-w-[240px] flex-1',
        // Active tab styling with proper z-index for overlapping
        isActive
          ? 'bg-background text-foreground z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.05)] border-t border-l border-r border-border'
          : 'bg-sidebar-accent/60 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground z-10 hover:z-15 shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
        // Add overlap effect - each tab overlaps the previous one
        index > 0 && '-ml-3',
        // Ensure proper stacking order
        `relative`
      )}
      style={{
        clipPath: isActive
          ? 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 100%, 0% 100%)'
          : 'polygon(12px 0%, calc(100% - 12px) 0%, calc(100% - 6px) 100%, 6px 100%)',
      }}
      onClick={onClick}
    >
      {/* Tab content */}
      <div className="flex items-center gap-2 flex-1 min-w-0 z-10">
        <LayoutTabBarContent location={tab.location} router={router} />
        <button
          className={cn(
            'opacity-0 group-hover/tab:opacity-100 transition-all duration-200 flex-shrink-0 rounded-full p-1 hover:bg-destructive/20 hover:text-destructive',
            isActive && 'opacity-70 hover:opacity-100',
            'ml-auto' // Push to the right edge
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Close tab"
        >
          <X className="size-3" />
        </button>
      </div>

      {/* Browser-like tab separator */}
      {!isActive && !isLast && (
        <div className="absolute right-0 top-2 bottom-2 w-px bg-border/50" />
      )}
    </div>
  );
};
