import { createRoute, redirect } from '@tanstack/react-router';

import { TagNodesContainer } from '@colanode/ui/components/tags/tag-nodes-container';
import { getWorkspaceUserId } from '@colanode/ui/routes/utils';
import {
  workspaceRoute,
  workspaceMaskRoute,
} from '@colanode/ui/routes/workspace';

export const tagNodesRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: '/tags/$tagId',
  component: () => {
    const { tagId } = tagNodesRoute.useParams();
    return <TagNodesContainer tagId={tagId} />;
  },
});

export const tagNodesMaskRoute = createRoute({
  getParentRoute: () => workspaceMaskRoute,
  path: '/tags/$tagId',
  component: () => null,
  beforeLoad: (ctx) => {
    const userId = getWorkspaceUserId(ctx.params.workspaceId);
    if (userId) {
      throw redirect({
        to: '/workspace/$userId/tags/$tagId',
        params: { userId, tagId: ctx.params.tagId },
        replace: true,
      });
    }
  },
});
