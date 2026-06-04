import { X } from 'lucide-react';

import { FieldSelect } from '@colanode/ui/components/databases/fields/field-select';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

export const ViewGroupSettings = () => {
    const workspace = useWorkspace();
    const database = useDatabase();
    const view = useDatabaseView();

    const groupableFields = database.fields.filter(
        (field) => field.type === 'select' || field.type === 'multi_select'
    );

    const updateGroupBy = (fieldId: string | null) => {
        workspace.collections.nodes.update(view.id, (draft) => {
            if (draft.type !== 'database_view') {
                return;
            }

            draft.groupBy = fieldId;
        });
    };

    return (
        <div className="flex flex-col gap-2 text-sm">
            <p className="my-1 font-semibold">Group by</p>
            {groupableFields.length > 0 ? (
                <div className="flex flex-row items-center gap-1">
                    <div className="flex-1">
                        <FieldSelect
                            fields={groupableFields}
                            value={view.groupBy ?? null}
                            onChange={(fieldId) => updateGroupBy(fieldId)}
                        />
                    </div>
                    {view.groupBy && (
                        <button
                            type="button"
                            title="Remove grouping"
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                            onClick={() => updateGroupBy(null)}
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            ) : (
                <p className="text-muted-foreground">
                    Create a select or multi-select field to group records.
                </p>
            )}
        </div>
    );
};
