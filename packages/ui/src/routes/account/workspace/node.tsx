import { createRoute, notFound, redirect } from '@tanstack/react-router';

import { NodeErrorScreen } from '@colanode/ui/components/nodes/node-error-screen';
import { NodeScreen } from '@colanode/ui/components/nodes/node-screen';
import { NodeTab } from '@colanode/ui/components/nodes/node-tab';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/account/workspace';
import { getAccountForWorkspace } from '@colanode/ui/routes/utils';

export const nodeRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/$nodeId',
  component: NodeScreen,
  errorComponent: NodeErrorScreen,
  context: (ctx) => {
    return {
      tab: (
        <NodeTab
          accountId={ctx.params.accountId}
          workspaceId={ctx.params.workspaceId}
          nodeId={ctx.params.nodeId}
        />
      ),
    };
  },
});

export const nodeMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/$nodeId',
  component: () => null,
  beforeLoad: (ctx) => {
    const account = getAccountForWorkspace(ctx.params.workspaceId);
    if (account) {
      throw redirect({
        to: '/acc/$accountId/$workspaceId/$nodeId',
        params: {
          accountId: account.id,
          workspaceId: ctx.params.workspaceId,
          nodeId: ctx.params.nodeId,
        },
        replace: true,
      });
    }

    throw notFound();
  },
});
