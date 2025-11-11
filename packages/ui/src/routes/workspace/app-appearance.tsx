import { createRoute, redirect } from '@tanstack/react-router';

import { AppAppearanceSettingsContainer } from '@colanode/ui/components/app/app-appearance-settings-container';
import { AppAppearanceSettingsHeader } from '@colanode/ui/components/app/app-appearance-settings-header';
import { AppAppearanceSettingsTab } from '@colanode/ui/components/app/app-appearance-settings-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettingsContainer,
  context: () => {
    return {
      tab: <AppAppearanceSettingsTab />,
      header: <AppAppearanceSettingsHeader />,
    };
  },
});

export const appAppearanceMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/app/appearance',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/app/appearance',
        params: { userId },
        replace: true,
      });
    }
  },
});
