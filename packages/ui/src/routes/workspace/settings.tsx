import { createRoute, redirect } from '@tanstack/react-router';

import { WorkspaceSettingsContainer } from '@colanode/ui/components/workspaces/workspace-settings-container';
import { WorkspaceSettingsTab } from '@colanode/ui/components/workspaces/workspace-settings-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/settings',
  component: WorkspaceSettingsContainer,
  context: () => {
    return {
      tab: <WorkspaceSettingsTab />,
    };
  },
});

export const workspaceSettingsMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/settings',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/settings',
        params: { userId },
        replace: true,
      });
    }
  },
});
