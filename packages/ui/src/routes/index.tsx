import { createRouter } from '@tanstack/react-router';

import { accountRoute } from '@colanode/ui/routes/account';
import {
  workspaceCreateRoute,
  workspaceCreateMaskRoute,
} from '@colanode/ui/routes/account/create';
import { accountRedirectRoute } from '@colanode/ui/routes/account/redirect';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/account/workspace';
import {
  accountLogoutMaskRoute,
  accountLogoutRoute,
} from '@colanode/ui/routes/account/workspace/account-logout';
import {
  accountSettingsMaskRoute,
  accountSettingsRoute,
} from '@colanode/ui/routes/account/workspace/account-settings';
import {
  appAppearanceMaskRoute,
  appAppearanceRoute,
} from '@colanode/ui/routes/account/workspace/app-appearance';
import {
  workspaceDownloadsMaskRoute,
  workspaceDownloadsRoute,
} from '@colanode/ui/routes/account/workspace/downloads';
import {
  workspaceHomeMaskRoute,
  workspaceHomeRoute,
} from '@colanode/ui/routes/account/workspace/home';
import {
  nodeMaskRoute,
  nodeRoute,
} from '@colanode/ui/routes/account/workspace/node';
import {
  workspaceRedirectMaskRoute,
  workspaceRedirectRoute,
} from '@colanode/ui/routes/account/workspace/redirect';
import {
  workspaceSettingsMaskRoute,
  workspaceSettingsRoute,
} from '@colanode/ui/routes/account/workspace/settings';
import {
  workspaceStorageMaskRoute,
  workspaceStorageRoute,
} from '@colanode/ui/routes/account/workspace/storage';
import {
  workspaceUploadsMaskRoute,
  workspaceUploadsRoute,
} from '@colanode/ui/routes/account/workspace/uploads';
import {
  workspaceUsersMaskRoute,
  workspaceUsersRoute,
} from '@colanode/ui/routes/account/workspace/users';
import { homeRoute } from '@colanode/ui/routes/home';
import { loginRoute } from '@colanode/ui/routes/login';
import { rootRoute } from '@colanode/ui/routes/root';

export const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  accountRoute.addChildren([
    accountRedirectRoute,
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
  ]),
  workspaceCreateMaskRoute,
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
