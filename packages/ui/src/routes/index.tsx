import { createRouter } from '@tanstack/react-router';

import { workspaceCreateRoute } from '@colanode/ui/routes/create';
import { homeRoute } from '@colanode/ui/routes/home';
import { rootRoute } from '@colanode/ui/routes/root';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';
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
import { infoMaskRoute, infoRoute } from '@colanode/ui/routes/workspace/info';
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
  tagNodesMaskRoute,
  tagNodesRoute,
} from '@colanode/ui/routes/workspace/tag-nodes';
import {
  workspaceMetaTypesMaskRoute,
  workspaceMetaTypesRoute,
} from '@colanode/ui/routes/workspace/meta-types';
import {
  workspaceTagsMaskRoute,
  workspaceTagsRoute,
} from '@colanode/ui/routes/workspace/tags';
import {
  workspaceUsersMaskRoute,
  workspaceUsersRoute,
} from '@colanode/ui/routes/workspace/users';

export const routeTree = rootRoute.addChildren([
  homeRoute,
  workspaceCreateRoute,
  workspaceRoute.addChildren([
    workspaceRedirectRoute,
    workspaceHomeRoute,
    nodeRoute.addChildren([modalNodeRoute]),
    workspaceDownloadsRoute,
    workspaceUsersRoute,
    workspaceSettingsRoute,
    tagNodesRoute,
    workspaceMetaTypesRoute,
    workspaceTagsRoute,
    infoRoute,
    appAppearanceRoute,
  ]),
  workspaceMaskRoute.addChildren([
    workspaceRedirectMaskRoute,
    workspaceHomeMaskRoute,
    nodeMaskRoute,
    workspaceSettingsMaskRoute,
    tagNodesMaskRoute,
    workspaceMetaTypesMaskRoute,
    workspaceTagsMaskRoute,
    workspaceUsersMaskRoute,
    workspaceDownloadsMaskRoute,
    infoMaskRoute,
    appAppearanceMaskRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
