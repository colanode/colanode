import {
  Cylinder,
  Download,
  LogOut,
  Settings,
  Upload,
  Users,
} from 'lucide-react';

import { SpecialContainerTabPath } from '@colanode/client/types';
import { SidebarHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-header';
import { SidebarSettingsItem } from '@colanode/ui/components/layouts/sidebars/sidebar-settings-item';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';

export const SidebarSettings = () => {
  const app = useApp();

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
