import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { collections } from '@colanode/ui/collections';
import { buildMetadataKey } from '@colanode/ui/collections/metadata';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceMaskRoute,
  workspaceRoute,
} from '@colanode/ui/routes/workspace';

export const workspaceRedirectRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const workspace = collections.workspaces.get(ctx.params.userId);

    if (!workspace) {
      throw notFound();
    }

    const metadataKey = buildMetadataKey(workspace.userId, 'location');
    const metadataValue = collections.metadata.get(metadataKey)?.value;
    const lastLocation = metadataValue ? JSON.parse(metadataValue) : undefined;

    if (lastLocation) {
      throw redirect({ to: lastLocation, replace: true });
    }

    throw redirect({
      from: '/workspace/$userId',
      to: 'home',
      replace: true,
    });
  },
});

export const workspaceRedirectMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/home',
        params: { userId },
        replace: true,
      });
    }

    throw notFound();
  },
});
