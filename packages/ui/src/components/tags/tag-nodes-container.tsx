import { eq, useLiveQuery } from '@tanstack/react-db';

import { TagAttributes } from '@colanode/core';
import { Container } from '@colanode/ui/components/layouts/containers/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { TagLink } from '@colanode/ui/components/tags/tag-link';
import { TagNodesBreadcrumb } from '@colanode/ui/components/tags/tag-nodes-breadcrumb';
import { TagNodesList } from '@colanode/ui/components/tags/tag-nodes-list';
import { collections } from '@colanode/ui/collections';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface TagNodesContainerProps {
  tagId: string;
}

export const TagNodesContainer = ({ tagId }: TagNodesContainerProps) => {
  const workspace = useWorkspace();

  const tagsQuery = useLiveQuery(
    (q) =>
      q
        .from({ workspaces: collections.workspaces })
        .where(({ workspaces }) => eq(workspaces.userId, workspace.userId))
        .select(({ workspaces }) => ({
          tags: workspaces.tags,
        }))
        .findOne(),
    [workspace.userId]
  );

  const tag = tagsQuery.data?.tags?.[tagId] as TagAttributes | undefined;

  return (
    <Container
      type="full"
      breadcrumb={<TagNodesBreadcrumb tagId={tagId} />}
    >
      <div className="max-w-4xl space-y-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Tagged nodes
            </h2>
            {tag && <TagLink tag={tag} userId={workspace.userId} />}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Pages and other nodes using this tag across all spaces.
          </p>
          <Separator className="mt-3" />
        </div>
        <TagNodesList tagId={tagId} />
      </div>
    </Container>
  );
};
