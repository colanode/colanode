import { createRoute, redirect } from '@tanstack/react-router';

import { AppAppearanceSettingsBreadcrumb } from '@colanode/ui/components/app/app-appearance-settings-breadcrumb';
import { AppAppearanceSettingsScreen } from '@colanode/ui/components/app/app-appearance-settings-screen';
import { AppAppearanceSettingsTab } from '@colanode/ui/components/app/app-appearance-settings-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const appAppearanceRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/app/appearance',
  component: AppAppearanceSettingsScreen,
  context: () => {
    return {
      tab: <AppAppearanceSettingsTab />,
      breadcrumb: <AppAppearanceSettingsBreadcrumb />,
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
