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
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';

export const SidebarSettings = () => {
  const { t } = useI18n();
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
        <SidebarHeader title={t('workspace.workspaceSettings')} />
        <SidebarSettingsItem
          title={t('common.general')}
          icon={Settings}
          path={SpecialContainerTabPath.WorkspaceSettings}
        />
        <SidebarSettingsItem
          title={t('workspace.users')}
          icon={Users}
          path={SpecialContainerTabPath.WorkspaceUsers}
        />
        <SidebarSettingsItem
          title={t('workspace.storage')}
          icon={Cylinder}
          path={SpecialContainerTabPath.WorkspaceStorage}
        />
        <SidebarSettingsItem
          title={t('workspace.uploads')}
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
            title={t('workspace.downloads')}
            icon={Download}
            path={SpecialContainerTabPath.WorkspaceDownloads}
          />
        )}
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title={t('account.accountSettings')} />
        <SidebarSettingsItem
          title={t('common.general')}
          icon={Settings}
          path={SpecialContainerTabPath.AccountSettings}
        />
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title={t('app.appSettings')} />
        <SidebarSettingsItem
          title={t('common.appearance')}
          icon={Palette}
          path={SpecialContainerTabPath.AppAppearance}
        />
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <Separator className="my-2" />
        <SidebarSettingsItem
          title={t('common.logout')}
          icon={LogOut}
          path={SpecialContainerTabPath.AccountLogout}
        />
      </div>
    </div>
  );
};
