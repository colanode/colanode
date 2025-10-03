import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

import { useTabManager } from '@colanode/ui/contexts/tab-manager';
import { useAppStore } from '@colanode/ui/stores/app';

export const TabAddButton = () => {
  const tabManager = useTabManager();
  const lastActiveAccount = useAppStore(
    useShallow((state) => state.metadata.account)
  );

  const lastActiveWorkspace = useAppStore(
    useShallow((state) =>
      lastActiveAccount
        ? state.accounts[lastActiveAccount]?.metadata.workspace
        : undefined
    )
  );

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
