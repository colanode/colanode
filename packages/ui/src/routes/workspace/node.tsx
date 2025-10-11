import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { NodeErrorScreen } from '@colanode/ui/components/nodes/node-error-screen';
import { NodeScreen } from '@colanode/ui/components/nodes/node-screen';
import { NodeTab } from '@colanode/ui/components/nodes/node-tab';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const nodeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/$nodeId',
  component: NodeScreen,
  errorComponent: NodeErrorScreen,
  context: (ctx) => {
    return {
      tab: <NodeTab userId={ctx.params.userId} nodeId={ctx.params.nodeId} />,
    };
  },
});

export const nodeMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/$nodeId',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/$nodeId',
        params: {
          userId,
          nodeId: ctx.params.nodeId,
        },
        replace: true,
      });
    }

    throw notFound();
  },
});
