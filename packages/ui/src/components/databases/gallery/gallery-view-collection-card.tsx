import { useNavigate } from '@tanstack/react-router';

import { FieldIcon } from '@colanode/ui/components/databases/fields/field-icon';
import { RecordFieldValue } from '@colanode/ui/components/records/record-field-value';
import { Link } from '@colanode/ui/components/ui/link';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { CollectionRow } from '@colanode/ui/lib/collection-row';

interface GalleryViewCollectionCardProps {
  row: CollectionRow;
}

export const GalleryViewCollectionCard = ({ row }: GalleryViewCollectionCardProps) => {
  const view = useDatabaseView();
  const workspace = useWorkspace();
  const navigate = useNavigate();

  const name = row.name;
  const hasName = name !== null && name !== '';

  const content = (
    <>
      <p className={hasName ? 'font-medium' : 'font-medium text-muted-foreground'}>
        {hasName ? name : 'Unnamed'}
      </p>
      {view.fields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {view.fields.map((viewField) => {
            if (!viewField.display) {
              return null;
            }

            return (
              <div
                key={viewField.field.id}
                className="flex flex-row items-center gap-1.5 text-sm text-muted-foreground"
              >
                <FieldIcon type={viewField.field.type} className="size-3.5" />
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
        className="animate-fade-in flex cursor-pointer flex-col gap-2 rounded-md border p-3 text-left hover:bg-accent"
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
      className="animate-fade-in flex cursor-pointer flex-col gap-2 rounded-md border p-3 text-left hover:bg-accent"
    >
      {content}
    </Link>
  );
};
