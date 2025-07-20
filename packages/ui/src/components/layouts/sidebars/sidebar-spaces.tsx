import { SidebarHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-header';
import { SpaceCreateButton } from '@colanode/ui/components/spaces/space-create-button';
import { SpaceSidebarItem } from '@colanode/ui/components/spaces/space-sidebar-item';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const SidebarSpaces = () => {
  const workspace = useWorkspace();
  const canCreateSpace =
    workspace.role !== 'guest' && workspace.role !== 'none';

  const spaceListQuery = useLiveQuery({
    type: 'space.list',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    parentId: workspace.id,
    page: 0,
    count: 100,
  });

  const spaces = spaceListQuery.data ?? [];

  return (
    <div className="flex flex-col group/sidebar-spaces h-full px-2">
      <SidebarHeader
        title="Spaces"
        actions={canCreateSpace && <SpaceCreateButton />}
      />
      <div className="flex w-full min-w-0 flex-col gap-1">
        {spaces.map((space) => (
          <SpaceSidebarItem space={space} key={space.id} />
        ))}
      </div>
    </div>
  );
};
