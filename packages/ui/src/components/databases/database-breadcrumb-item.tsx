import { LocalDatabaseNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/containers/breadcrumb-item';

interface DatabaseBreadcrumbItemProps {
  database: LocalDatabaseNode;
}

export const DatabaseBreadcrumbItem = ({
  database,
}: DatabaseBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      id={database.id}
      avatar={database.attributes.avatar}
      name={database.attributes.name}
    />
  );
};
