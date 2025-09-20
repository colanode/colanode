import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

import { useAppStore } from '@colanode/ui/stores/app';

export const useLocationTracker = (accountId: string, workspaceId: string) => {
  const router = useRouter();

  useEffect(() => {
    router.subscribe('onLoad', (event) => {
      if (!event.hrefChanged) {
        return;
      }

      const location = event.toLocation.href;
      if (!location.includes(`/acc/${accountId}/${workspaceId}`)) {
        return;
      }

      useAppStore.getState().updateWorkspaceMetadata(accountId, workspaceId, {
        key: 'location',
        value: location,
      });

      window.colanode.executeMutation({
        type: 'workspace.metadata.update',
        accountId: accountId,
        workspaceId: workspaceId,
        key: 'location',
        value: location,
      });
    });
  }, [accountId, workspaceId, router]);
};
