import {
  Cylinder,
  Download,
  LogOut,
  Palette,
  Settings,
  Upload,
  Users,
} from 'lucide-react';

import { SpecialContainerTabPath } from '@colanode/client/types';
import { SidebarHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-header';
import { SidebarSettingsItem } from '@colanode/ui/components/layouts/sidebars/sidebar-settings-item';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const SidebarSettings = () => {
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
        <SidebarHeader title="Workspace settings" />
        <SidebarSettingsItem
          title="General"
          icon={Settings}
          path={SpecialContainerTabPath.WorkspaceSettings}
        />
        <SidebarSettingsItem
          title="Users"
          icon={Users}
          path={SpecialContainerTabPath.WorkspaceUsers}
        />
        <SidebarSettingsItem
          title="Storage"
          icon={Cylinder}
          path={SpecialContainerTabPath.WorkspaceStorage}
        />
        <SidebarSettingsItem
          title="Uploads"
          icon={Upload}
          path={SpecialContainerTabPath.WorkspaceUploads}
          unreadBadge={{
            count: pendingUploadsCount,
            unread: pendingUploadsCount > 0,
            maxCount: 20,
            className: 'bg-blue-500',
          }}
        />
        {app.type === 'desktop' && (
          <SidebarSettingsItem
            title="Downloads"
            icon={Download}
            path={SpecialContainerTabPath.WorkspaceDownloads}
          />
        )}
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title="Account settings" />
        <SidebarSettingsItem
          title="General"
          icon={Settings}
          path={SpecialContainerTabPath.AccountSettings}
        />
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title="App settings" />
        <SidebarSettingsItem
          title="Appearance"
          icon={Palette}
          path={SpecialContainerTabPath.AppAppearance}
        />
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <Separator className="my-2" />
        <SidebarSettingsItem
          title="Logout"
          icon={LogOut}
          path={SpecialContainerTabPath.AccountLogout}
        />
      </div>
    </div>
  );
};
