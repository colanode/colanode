import { createRouter } from '@tanstack/react-router';

import { authRoute } from '@colanode/ui/routes/auth';
import { loginRoute } from '@colanode/ui/routes/auth/login';
import { registerRoute } from '@colanode/ui/routes/auth/register';
import { resetRoute } from '@colanode/ui/routes/auth/reset';
import { workspaceCreateRoute } from '@colanode/ui/routes/create';
import { homeRoute } from '@colanode/ui/routes/home';
import { rootRoute } from '@colanode/ui/routes/root';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';
import {
  accountSettingsMaskRoute,
  accountSettingsRoute,
} from '@colanode/ui/routes/workspace/account';
import {
  appAppearanceMaskRoute,
  appAppearanceRoute,
} from '@colanode/ui/routes/workspace/appearance';
import {
  workspaceDownloadsMaskRoute,
  workspaceDownloadsRoute,
} from '@colanode/ui/routes/workspace/downloads';
import {
  workspaceHomeMaskRoute,
  workspaceHomeRoute,
} from '@colanode/ui/routes/workspace/home';
import {
  logoutMaskRoute,
  logoutRoute,
} from '@colanode/ui/routes/workspace/logout';
import { modalNodeRoute } from '@colanode/ui/routes/workspace/modal';
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
  authRoute.addChildren([loginRoute, registerRoute, resetRoute]),
  workspaceCreateRoute,
  workspaceRoute.addChildren([
    workspaceRedirectRoute,
    workspaceHomeRoute,
    nodeRoute.addChildren([modalNodeRoute]),
    workspaceDownloadsRoute,
    workspaceUploadsRoute,
    workspaceStorageRoute,
    workspaceUsersRoute,
    workspaceSettingsRoute,
    accountSettingsRoute,
    logoutRoute,
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
    logoutMaskRoute,
    appAppearanceMaskRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
