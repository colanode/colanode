import { FieldAttributes } from '@colanode/core';
import { BoardViewColumnsCollaborator } from '@colanode/ui/components/databases/boards/board-view-columns-collaborator';
import { BoardViewColumnsCreatedBy } from '@colanode/ui/components/databases/boards/board-view-columns-created-by';
import { BoardViewColumnsMultiSelect } from '@colanode/ui/components/databases/boards/board-view-columns-multi-select';
import { BoardViewColumnsSelect } from '@colanode/ui/components/databases/boards/board-view-columns-select';
import { useI18n } from '@colanode/ui/contexts/i18n';

interface BoardViewColumnsProps {
  field: FieldAttributes;
}

export const BoardViewColumns = ({ field }: BoardViewColumnsProps) => {
  const { t } = useI18n();
  switch (field.type) {
    case 'select':
      return <BoardViewColumnsSelect field={field} />;
    case 'multi_select':
      return <BoardViewColumnsMultiSelect field={field} />;
    case 'collaborator':
      return <BoardViewColumnsCollaborator field={field} />;
    case 'created_by':
      return <BoardViewColumnsCreatedBy field={field} />;
    default:
      return <p>{t('field.unsupportedFieldType')}</p>;
  }
};
