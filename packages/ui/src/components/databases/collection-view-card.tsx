import { useNavigate } from '@tanstack/react-router';

import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { Link } from '@colanode/ui/components/ui/link';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { CollectionRow } from '@colanode/ui/lib/collection-row';
import { cn } from '@colanode/ui/lib/utils';

interface CollectionViewCardProps {
  row: CollectionRow;
  className?: string;
  compact?: boolean;
}

export const CollectionViewCard = ({
  row,
  className,
  compact = false,
}: CollectionViewCardProps) => {
  const view = useDatabaseView();
  const workspace = useWorkspace();
  const navigate = useNavigate();

  const name = row.name;
  const hasName = name !== null && name !== '';

  const content = (
    <>
      <p
        className={
          hasName
            ? compact
              ? ''
              : 'font-medium'
            : compact
              ? 'text-muted-foreground'
              : 'font-medium text-muted-foreground'
        }
      >
        {hasName ? name : 'Unnamed'}
      </p>
      {view.fields.length > 0 && (
        <div className={cn('flex flex-col', compact ? 'mt-2 gap-1' : 'gap-1.5')}>
          {view.fields.map((viewField) => {
            if (!viewField.display) {
              return null;
            }

            return (
              <div
                key={viewField.field.id}
                className={cn(
                  'flex flex-row items-center gap-1.5 text-sm text-muted-foreground',
                  compact && 'flex-col items-start gap-1'
                )}
              >
                {!compact && <FieldIcon type={viewField.field.type} className="size-3.5" />}
                <div className="min-w-0 flex-1 truncate">
                  <RecordFieldValue field={viewField.field} readOnly={true} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const cardClassName = cn(
    'animate-fade-in flex cursor-pointer flex-col text-left hover:bg-accent',
    compact ? 'gap-1 rounded-md border p-2' : 'gap-2 rounded-md border p-3',
    className
  );

  if (row.nodeType === 'page') {
    return (
      <button
        type="button"
        onClick={() =>
          navigate({
            to: '/workspace/$userId/$nodeId',
            params: { userId: workspace.userId, nodeId: row.id },
          })
        }
        className={cardClassName}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      from="/workspace/$userId/$nodeId"
      to="modal/$modalNodeId"
      params={{ modalNodeId: row.id }}
      className={cardClassName}
    >
      {content}
    </Link>
  );
};
