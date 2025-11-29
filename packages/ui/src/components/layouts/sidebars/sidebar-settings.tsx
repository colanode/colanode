import { count, inArray, useLiveQuery } from '@tanstack/react-db';
import {
  Cylinder,
  Download,
  LogOut,
  Palette,
  Settings,
  Upload,
  Users,
} from 'lucide-react';

import { UploadStatus } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import { SidebarHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-header';
import { SidebarSettingsItem } from '@colanode/ui/components/layouts/sidebars/sidebar-settings-item';
import { Link } from '@colanode/ui/components/ui/link';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useApp } from '@colanode/ui/contexts/app';
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const SidebarSettings = () => {
  const { t } = useI18n();
  const app = useApp();
  const workspace = useWorkspace();

  const pendingUploadsQuery = useLiveQuery((q) =>
    q
      .from({ uploads: collections.workspace(workspace.userId).uploads })
      .where(({ uploads }) =>
        inArray(uploads.status, [UploadStatus.Pending, UploadStatus.Uploading])
      )
      .select(({ uploads }) => ({
        count: count(uploads.fileId),
      }))
      .findOne()
  );

  const pendingUploads = pendingUploadsQuery.data?.count ?? 0;

  return (
    <div className="flex flex-col gap-4 h-full px-2 group/sidebar">
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title={t('workspace.workspaceSettings')} />
        <Link from="/workspace/$userId" to="settings">
          {({ isActive }) => (
            <SidebarSettingsItem
              title={t('common.general')}
              icon={Settings}
              isActive={isActive}
            />
          )}
        </Link>

        <Link from="/workspace/$userId" to="users">
          {({ isActive }) => (
            <SidebarSettingsItem
              title={t('workspace.users')}
              icon={Users}
              isActive={isActive}
            />
          )}
        </Link>
        <Link from="/workspace/$userId" to="storage">
          {({ isActive }) => (
            <SidebarSettingsItem
              title={t('workspace.storage')}
              icon={Cylinder}
              isActive={isActive}
            />
          )}
        </Link>
        <Link from="/workspace/$userId" to="uploads">
          {({ isActive }) => (
            <SidebarSettingsItem
              title={t('workspace.uploads')}
              icon={Upload}
              isActive={isActive}
              unreadBadge={{
                count: pendingUploads,
                unread: pendingUploads > 0,
                maxCount: 20,
                className: 'bg-blue-500',
              }}
            />
          )}
        </Link>
        {app.type === 'desktop' && (
          <Link from="/workspace/$userId" to="downloads">
            {({ isActive }) => (
              <SidebarSettingsItem
                title={t('workspace.downloads')}
                icon={Download}
                isActive={isActive}
              />
            )}
          </Link>
        )}
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title={t('account.accountSettings')} />
        <Link from="/workspace/$userId" to="account">
          {({ isActive }) => (
            <SidebarSettingsItem
              title={t('common.general')}
              icon={Settings}
              isActive={isActive}
            />
          )}
        </Link>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title={t('app.appSettings')} />
        <Link from="/workspace/$userId" to="appearance">
          {({ isActive }) => (
            <SidebarSettingsItem
              title={t('common.appearance')}
              icon={Palette}
              isActive={isActive}
            />
          )}
        </Link>
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <Separator className="my-2" />
        <Link from="/workspace/$userId" to="logout">
          {({ isActive }) => (
            <SidebarSettingsItem
              title={t('common.logout')}
              icon={LogOut}
              isActive={isActive}
            />
          )}
        </Link>
      </div>
    </div>
  );
};
