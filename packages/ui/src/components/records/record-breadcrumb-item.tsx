import { LocalRecordNode } from '@colanode/client/types';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

interface RecordBreadcrumbItemProps {
  record: LocalRecordNode;
}

export const RecordBreadcrumbItem = ({ record }: RecordBreadcrumbItemProps) => {
  return (
    <BreadcrumbItem
      id={record.id}
      avatar={record.attributes.avatar}
      name={record.attributes.name}
    />
  );
};
