import { LocalDatabaseNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';

interface DatabaseBreadcrumbItemProps {
  database: LocalDatabaseNode;
}

export const DatabaseBreadcrumbItem = ({
  database,
}: DatabaseBreadcrumbItemProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Avatar
        id={database.id}
        name={database.attributes.name}
        avatar={database.attributes.avatar}
        className="size-4"
      />
      <span>{database.attributes.name}</span>
    </div>
  );
};
