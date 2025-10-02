import { Cylinder } from 'lucide-react';

import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';
import { UserStorageStats } from '@colanode/ui/components/workspaces/storage/user-storage-stats';
import { WorkspaceStorageStats } from '@colanode/ui/components/workspaces/storage/workspace-storage-stats';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const WorkspaceStorageScreen = () => {
  const workspace = useWorkspace();
  const canManageStorage =
    workspace.role === 'owner' || workspace.role === 'admin';

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem
          icon={(className) => <Cylinder className={className} />}
          name="Storage"
        />
      </Breadcrumb>
      <div className="max-w-4xl space-y-10">
        <UserStorageStats />
        {canManageStorage && <WorkspaceStorageStats />}
      </div>
    </>
  );
};
