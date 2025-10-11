import { createRouter } from '@tanstack/react-router';

import { workspaceCreateRoute } from '@colanode/ui/routes/create';
import { homeRoute } from '@colanode/ui/routes/home';
import { loginRoute } from '@colanode/ui/routes/login';
import { rootRoute } from '@colanode/ui/routes/root';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';
import {
  accountLogoutMaskRoute,
  accountLogoutRoute,
} from '@colanode/ui/routes/workspace/account-logout';
import {
  accountSettingsMaskRoute,
  accountSettingsRoute,
} from '@colanode/ui/routes/workspace/account-settings';
import {
  appAppearanceMaskRoute,
  appAppearanceRoute,
} from '@colanode/ui/routes/workspace/app-appearance';
import {
  workspaceDownloadsMaskRoute,
  workspaceDownloadsRoute,
} from '@colanode/ui/routes/workspace/downloads';
import {
  workspaceHomeMaskRoute,
  workspaceHomeRoute,
} from '@colanode/ui/routes/workspace/home';
import { nodeMaskRoute, nodeRoute } from '@colanode/ui/routes/workspace/node';
import {
  workspaceRedirectMaskRoute,
  workspaceRedirectRoute,
} from '@colanode/ui/routes/workspace/redirect';
import {
  workspaceSettingsMaskRoute,
  workspaceSettingsRoute,
} from '@colanode/ui/routes/workspace/settings';
import {
  workspaceStorageMaskRoute,
  workspaceStorageRoute,
} from '@colanode/ui/routes/workspace/storage';
import {
  workspaceUploadsMaskRoute,
  workspaceUploadsRoute,
} from '@colanode/ui/routes/workspace/uploads';
import {
  workspaceUsersMaskRoute,
  workspaceUsersRoute,
} from '@colanode/ui/routes/workspace/users';

export const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  workspaceCreateRoute,
  workspaceRoute.addChildren([
    workspaceRedirectRoute,
    workspaceHomeRoute,
    nodeRoute,
    workspaceDownloadsRoute,
    workspaceUploadsRoute,
    workspaceStorageRoute,
    workspaceUsersRoute,
    workspaceSettingsRoute,
    accountSettingsRoute,
    accountLogoutRoute,
    appAppearanceRoute,
  ]),
  workspaceMaskRoute.addChildren([
    workspaceRedirectMaskRoute,
    workspaceHomeMaskRoute,
    nodeMaskRoute,
    workspaceSettingsMaskRoute,
    workspaceUsersMaskRoute,
    workspaceStorageMaskRoute,
    workspaceUploadsMaskRoute,
    workspaceDownloadsMaskRoute,
    accountSettingsMaskRoute,
    accountLogoutMaskRoute,
    appAppearanceMaskRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
