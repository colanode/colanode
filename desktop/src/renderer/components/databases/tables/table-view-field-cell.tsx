import React from 'react';
import { FieldNode, RecordNode } from '@/types/databases';
import { TableViewTextCell } from '@/renderer/components/databases/tables/cells/table-view-text-cell';
import { TableViewNumberCell } from '@/renderer/components/databases/tables/cells/table-view-number-cell';
import { TableViewBooleanCell } from '@/renderer/components/databases/tables/cells/table-view-boolean-cell';
import { TableViewCreatedAtCell } from '@/renderer/components/databases/tables/cells/table-view-created-at-cell';
import { TableViewCreatedByCell } from '@/renderer/components/databases/tables/cells/table-view-created-by-cell';
import { TableViewSelectCell } from '@/renderer/components/databases/tables/cells/table-view-select-cell';
import { TableViewPhoneCell } from '@/renderer/components/databases/tables/cells/table-view-phone-cell';
import { TableViewEmailCell } from '@/renderer/components/databases/tables/cells/table-view-email-cell';
import { TableViewUrlCell } from '@/renderer/components/databases/tables/cells/table-view-url-cell';
import { TableViewMultiSelectCell } from '@/renderer/components/databases/tables/cells/table-view-multi-select-cell';
import { TableViewDateCell } from '@/renderer/components/databases/tables/cells/table-view-date-cell';

interface TableViewFieldCellProps {
  record: RecordNode;
  field: FieldNode;
}

export const TableViewFieldCell = ({
  record,
  field,
}: TableViewFieldCellProps) => {
  switch (field.dataType) {
    case 'text':
      return <TableViewTextCell record={record} field={field} />;
    case 'number':
      return <TableViewNumberCell record={record} field={field} />;
    case 'boolean':
      return <TableViewBooleanCell record={record} field={field} />;
    case 'created_at':
      return <TableViewCreatedAtCell record={record} field={field} />;
    case 'created_by':
      return <TableViewCreatedByCell record={record} field={field} />;
    case 'select':
      return <TableViewSelectCell record={record} field={field} />;
    case 'phone':
      return <TableViewPhoneCell record={record} field={field} />;
    case 'email':
      return <TableViewEmailCell record={record} field={field} />;
    case 'url':
      return <TableViewUrlCell record={record} field={field} />;
    case 'multi_select':
      return <TableViewMultiSelectCell record={record} field={field} />;
    case 'collaborator':
      return null;
    case 'date':
      return <TableViewDateCell record={record} field={field} />;
    case 'file':
      return null;
    default:
      return null;
  }
};