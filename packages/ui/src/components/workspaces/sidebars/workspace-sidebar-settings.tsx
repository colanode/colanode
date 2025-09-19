import { Link } from '@tanstack/react-router';
import {
  Cylinder,
  Download,
  LogOut,
  Palette,
  Settings,
  Upload,
  Users,
} from 'lucide-react';

import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceSidebarHeader } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-header';
import { WorkspaceSidebarSettingsItem } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar-settings-item';
import { useApp } from '@colanode/ui/contexts/app';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const WorkspaceSidebarSettings = () => {
  const app = useApp();
  const workspace = useWorkspace();

  const pendingUploadsQuery = useLiveQuery({
    type: 'upload.list.pending',
    accountId: workspace.accountId,
    workspaceId: workspace.id,
    page: 1,
    count: 21,
  });

  const pendingUploads = pendingUploadsQuery.data ?? [];
  const pendingUploadsCount = pendingUploads.length;

  return (
    <div className="flex flex-col gap-4 h-full px-2 group/sidebar">
      <div className="flex w-full min-w-0 flex-col gap-1">
        <WorkspaceSidebarHeader title="Workspace settings" />
        <Link
          to="/$workspaceId/settings"
          params={{ workspaceId: workspace.id }}
        >
          {({ isActive }) => (
            <WorkspaceSidebarSettingsItem
              title="General"
              icon={Settings}
              isActive={isActive}
            />
          )}
        </Link>

        <Link to="/$workspaceId/users" params={{ workspaceId: workspace.id }}>
          {({ isActive }) => (
            <WorkspaceSidebarSettingsItem
              title="Users"
              icon={Users}
              isActive={isActive}
            />
          )}
        </Link>
        <Link to="/$workspaceId/storage" params={{ workspaceId: workspace.id }}>
          {({ isActive }) => (
            <WorkspaceSidebarSettingsItem
              title="Storage"
              icon={Cylinder}
              isActive={isActive}
            />
          )}
        </Link>
        <Link to="/$workspaceId/uploads" params={{ workspaceId: workspace.id }}>
          {({ isActive }) => (
            <WorkspaceSidebarSettingsItem
              title="Uploads"
              icon={Upload}
              isActive={isActive}
              unreadBadge={{
                count: pendingUploadsCount,
                unread: pendingUploadsCount > 0,
                maxCount: 20,
                className: 'bg-blue-500',
              }}
            />
          )}
        </Link>
        {app.type === 'desktop' && (
          <Link
            to="/$workspaceId/downloads"
            params={{ workspaceId: workspace.id }}
          >
            {({ isActive }) => (
              <WorkspaceSidebarSettingsItem
                title="Downloads"
                icon={Download}
                isActive={isActive}
              />
            )}
          </Link>
        )}
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <WorkspaceSidebarHeader title="Account settings" />
        <Link
          to="/$workspaceId/account/settings"
          params={{ workspaceId: workspace.id }}
        >
          {({ isActive }) => (
            <WorkspaceSidebarSettingsItem
              title="General"
              icon={Settings}
              isActive={isActive}
            />
          )}
        </Link>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <WorkspaceSidebarHeader title="App settings" />
        <Link
          to="/$workspaceId/app/appearance"
          params={{ workspaceId: workspace.id }}
        >
          {({ isActive }) => (
            <WorkspaceSidebarSettingsItem
              title="Appearance"
              icon={Palette}
              isActive={isActive}
            />
          )}
        </Link>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <Separator className="my-2" />
        <Link
          to="/$workspaceId/account/logout"
          params={{ workspaceId: workspace.id }}
        >
          {({ isActive }) => (
            <WorkspaceSidebarSettingsItem
              title="Logout"
              icon={LogOut}
              isActive={isActive}
            />
          )}
        </Link>
      </div>
    </div>
  );
};
