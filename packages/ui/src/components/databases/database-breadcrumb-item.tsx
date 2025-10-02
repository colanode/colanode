import { LocalDatabaseNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface DatabaseBreadcrumbItemProps {
  database: LocalDatabaseNode;
}

export const DatabaseBreadcrumbItem = ({
  database,
}: DatabaseBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={database.id}
          name={database.attributes.name}
          avatar={database.attributes.avatar}
          className={className}
        />
      )}
      name={database.attributes.name}
    />
  );
};
