import { Plus } from 'lucide-react';
import { useCallback } from 'react';

import { useTabManager } from '@colanode/ui/contexts/tab-manager';
import { getDefaultWorkspaceUserId } from '@colanode/ui/routes/utils';

export const TabAddButton = () => {
  const tabManager = useTabManager();
  const handleAddTab = useCallback(() => {
    const userId = getDefaultWorkspaceUserId();
    const location = userId ? `/workspace/${userId}/home` : '/';

    tabManager.addTab(location);
  }, []);

  return (
    <button
      onClick={handleAddTab}
      className="flex items-center justify-center w-10 h-10 bg-sidebar hover:bg-sidebar-accent transition-all duration-200 app-no-drag-region shrink-0 border-l border-border/30 hover:border-border/60 rounded-tl-md"
      title="Add new tab"
    >
      <Plus className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
    </button>
  );
};
