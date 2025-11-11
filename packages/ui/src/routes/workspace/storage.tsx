import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceStorageContainer } from '@colanode/ui/components/workspaces/storage/workspace-storage-container';
import { WorkspaceStorageHeader } from '@colanode/ui/components/workspaces/storage/workspace-storage-header';
import { WorkspaceStorageTab } from '@colanode/ui/components/workspaces/storage/workspace-storage-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceStorageRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/storage',
  component: WorkspaceStorageContainer,
  context: () => {
    return {
      tab: <WorkspaceStorageTab />,
      header: <WorkspaceStorageHeader />,
    };
  },
});

export const workspaceStorageMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/storage',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/storage',
        params: { userId },
        replace: true,
      });
    }
  },
});
