import { CircleDashed } from 'lucide-react';

import {
    DatabaseViewFilterAttributes,
    MultiSelectFieldAttributes,
    SelectFieldAttributes,
} from '@colanode/core';
import { ListViewGroup } from '@colanode/ui/components/databases/list/list-view-group';
import { useFieldValueCounts } from '@colanode/ui/hooks/use-field-value-counts';
import { getSelectOptionStrongStyle } from '@colanode/ui/lib/databases';

interface ListViewGroupedProps {
    field: SelectFieldAttributes | MultiSelectFieldAttributes;
}

const GroupCountBadge = ({ count }: { count: number }) => (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {count.toLocaleString()}
    </span>
);

export const ListViewGrouped = ({ field }: ListViewGroupedProps) => {
    const { values, noValueCount } = useFieldValueCounts(field);
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
                                    className="inline-flex items-center rounded-md border px-2.5 py-1 text-sm font-semibold shadow-sm"
                                    style={getSelectOptionStrongStyle(option.color)}
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
