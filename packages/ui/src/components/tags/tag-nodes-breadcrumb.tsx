import { eq, useLiveQuery } from '@tanstack/react-db';

import { TagAttributes } from '@colanode/core';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import { defaultIcons } from '@colanode/ui/lib/assets';
import { collections } from '@colanode/ui/collections';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface TagNodesBreadcrumbProps {
  tagId: string;
}

export const TagNodesBreadcrumb = ({ tagId }: TagNodesBreadcrumbProps) => {
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
    <>
      <BreadcrumbItem
        id="tags"
        avatar={defaultIcons.bookmark}
        name="Tags"
      />
      {tag ? (
        <SelectOptionBadge name={tag.name} color={tag.color} />
      ) : (
        <span className="text-sm text-muted-foreground">Tag</span>
      )}
    </>
  );
};
