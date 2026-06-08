import {
  Download,
  Info,
  Palette,
  Settings,
  Users,
} from 'lucide-react';

import { SidebarHeader } from '@colanode/ui/components/layouts/sidebars/sidebar-header';
import { SidebarSettingsItem } from '@colanode/ui/components/layouts/sidebars/sidebar-settings-item';
import { Link } from '@colanode/ui/components/ui/link';
import { useApp } from '@colanode/ui/contexts/app';
import { isLocalOnlyMode } from '@colanode/ui/routes/utils';

export const SidebarSettings = () => {
  const app = useApp();
  const localOnly = isLocalOnlyMode();

  return (
    <div className="flex flex-col gap-4 h-full px-2 group/sidebar">
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title="Workspace settings" />
        <Link from="/workspace/$userId" to="settings">
          {({ isActive }) => (
            <SidebarSettingsItem
              title="General"
              icon={Settings}
              isActive={isActive}
            />
          )}
        </Link>

        {!localOnly && (
          <Link from="/workspace/$userId" to="users">
            {({ isActive }) => (
              <SidebarSettingsItem
                title="Users"
                icon={Users}
                isActive={isActive}
              />
            )}
          </Link>
        )}
        {app.type === 'desktop' && (
          <Link from="/workspace/$userId" to="downloads">
            {({ isActive }) => (
              <SidebarSettingsItem
                title="Downloads"
                icon={Download}
                isActive={isActive}
              />
            )}
          </Link>
        )}
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1">
        <SidebarHeader title="App settings" />
        <Link from="/workspace/$userId" to="appearance">
          {({ isActive }) => (
            <SidebarSettingsItem
              title="Appearance"
              icon={Palette}
              isActive={isActive}
            />
          )}
        </Link>
        <Link from="/workspace/$userId" to="info">
          {({ isActive }) => (
            <SidebarSettingsItem
              title="Info"
              icon={Info}
              isActive={isActive}
            />
          )}
        </Link>
      </div>
    </div>
  );
};
