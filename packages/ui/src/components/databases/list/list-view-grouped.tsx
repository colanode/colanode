import { CircleDashed } from 'lucide-react';

import {
    DatabaseViewFilterAttributes,
    MultiSelectFieldAttributes,
    SelectFieldAttributes,
} from '@colanode/core';
import { ListViewGroup } from '@colanode/ui/components/databases/list/list-view-group';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useLiveQuery } from '@colanode/ui/hooks/use-live-query';
import { getSelectOptionStrongColorClass } from '@colanode/ui/lib/databases';
import { cn } from '@colanode/ui/lib/utils';

interface ListViewGroupedProps {
    field: SelectFieldAttributes | MultiSelectFieldAttributes;
}

const GroupCountBadge = ({ count }: { count: number }) => (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {count.toLocaleString()}
    </span>
);

export const ListViewGrouped = ({ field }: ListViewGroupedProps) => {
    const workspace = useWorkspace();
    const database = useDatabase();
    const view = useDatabaseView();

    const countQuery = useLiveQuery({
        type: 'record.field.value.count',
        databaseId: database.id,
        filters: view.filters,
        fieldId: field.id,
        userId: workspace.userId,
    });

    const values = countQuery.data?.values ?? [];
    const noValueCount = countQuery.data?.noValueCount ?? 0;
    const options = Object.values(field.options ?? {});

    return (
        <div className="flex flex-col gap-4">
            {options.map((option) => {
                const filter: DatabaseViewFilterAttributes = {
                    id: 'group',
                    type: 'field',
                    fieldId: field.id,
                    operator: 'is_in',
                    value: [option.id],
                };
                const count = values.find((v) => v.value === option.id)?.count ?? 0;

                return (
                    <ListViewGroup
                        key={option.id}
                        filter={filter}
                        header={
                            <div className="flex flex-row items-center gap-2">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold shadow-sm',
                                        getSelectOptionStrongColorClass(option.color)
                                    )}
                                >
                                    {option.name}
                                </span>
                                <GroupCountBadge count={count} />
                            </div>
                        }
                    />
                );
            })}
            <ListViewGroup
                key="__no_value__"
                filter={{
                    id: 'group',
                    type: 'field',
                    fieldId: field.id,
                    operator: 'is_empty',
                }}
                header={
                    <div className="flex flex-row items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1 text-sm font-semibold text-muted-foreground">
                            <CircleDashed className="size-3.5" />
                            No {field.name}
                        </span>
                        <GroupCountBadge count={noValueCount} />
                    </div>
                }
            />
        </div>
    );
};
