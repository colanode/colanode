import { LocalDatabaseNode } from '@colanode/client/types';

import { Avatar } from '@/renderer/components/avatars/avatar';
import { useLayout } from '@/renderer/contexts/layout';
import { cn } from '@/shared/lib/utils';

interface DatabaseSidebarItemProps {
  database: LocalDatabaseNode;
}

export const DatabaseSidebarItem = ({ database }: DatabaseSidebarItemProps) => {
  const layout = useLayout();
  const isActive = layout.activeTab === database.id;

  return (
    <button
      key={database.id}
      className={cn(
        'flex w-full items-center',
        isActive && 'bg-sidebar-accent'
      )}
    >
      <Avatar
        id={database.id}
        avatar={database.attributes.avatar}
        name={database.attributes.name}
        className="h-4 w-4"
      />
      <span className={cn('line-clamp-1 w-full flex-grow pl-2 text-left')}>
        {database.attributes.name ?? 'Unnamed'}
      </span>
    </button>
  );
};
