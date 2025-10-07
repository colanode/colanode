import { Plus } from 'lucide-react';
import { useMemo } from 'react';

import { useTabManager } from '@colanode/ui/contexts/tab-manager';
import { useAccountMetadata } from '@colanode/ui/hooks/use-account-metadata';
import { useAppMetadata } from '@colanode/ui/hooks/use-app-metadata';

export const TabAddButton = () => {
  const tabManager = useTabManager();
  const lastActiveAccount = useAppMetadata('account');
  const lastActiveWorkspace = useAccountMetadata('workspace');

  const location = useMemo(() => {
    if (lastActiveAccount && lastActiveWorkspace) {
      return `/acc/${lastActiveAccount}/${lastActiveWorkspace}/home`;
    }

    return '/';
  }, [lastActiveAccount, lastActiveWorkspace]);

  return (
    <button
      onClick={() => tabManager.addTab(location)}
      className="flex items-center justify-center w-10 h-10 bg-sidebar hover:bg-sidebar-accent transition-all duration-200 app-no-drag-region flex-shrink-0 border-l border-border/30 hover:border-border/60 rounded-tl-md"
      title="Add new tab"
    >
      <Plus className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
    </button>
  );
};
