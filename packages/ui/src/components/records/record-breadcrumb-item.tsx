import { LocalRecordNode } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb-item';

interface RecordBreadcrumbItemProps {
  record: LocalRecordNode;
}

export const RecordBreadcrumbItem = ({ record }: RecordBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      icon={(className) => (
        <Avatar
          id={record.id}
          name={record.attributes.name}
          avatar={record.attributes.avatar}
          className={className}
        />
      )}
      name={record.attributes.name}
    />
  );
};
