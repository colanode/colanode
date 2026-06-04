import { eq, useLiveQuery } from '@tanstack/react-db';
import { Check, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    FieldAttributes,
    RelationFieldAttributes,
    RollupAggregation,
} from '@colanode/core';
import { FieldSelect } from '@colanode/ui/components/databases/fields/field-select';
import { Button } from '@colanode/ui/components/ui/button';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@colanode/ui/components/ui/command';
import {
    Field,
    FieldLabel,
} from '@colanode/ui/components/ui/field';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

const AGGREGATION_OPTIONS: { value: RollupAggregation; label: string }[] = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
];

interface RollupConfigProps {
    relationFieldId: string | null | undefined;
    rolledUpFieldId: string | null | undefined;
    aggregation: RollupAggregation | null | undefined;
    onChangeRelationField: (fieldId: string | null) => void;
    onChangeRolledUpField: (fieldId: string | null) => void;
    onChangeAggregation: (aggregation: RollupAggregation) => void;
}

const AggregationSelect = ({
    value,
    onChange,
}: {
    value: RollupAggregation | null | undefined;
    onChange: (aggregation: RollupAggregation) => void;
}) => {
    const [open, setOpen] = useState(false);
    const selected = AGGREGATION_OPTIONS.find((option) => option.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between p-2"
                >
                    <span>{selected ? selected.label : 'Select aggregation...'}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-1">
                <Command className="min-h-min">
                    <CommandList>
                        <CommandGroup className="h-min">
                            {AGGREGATION_OPTIONS.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="flex w-full flex-row items-center gap-2">
                                        <p>{option.label}</p>
                                        <Check
                                            className={cn(
                                                'ml-auto size-4',
                                                value === option.value ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export const RollupConfig = ({
    relationFieldId,
    rolledUpFieldId,
    aggregation,
    onChangeRelationField,
    onChangeRolledUpField,
    onChangeAggregation,
}: RollupConfigProps) => {
    const workspace = useWorkspace();
    const database = useDatabase();

    const relationFields = useMemo(
        () =>
            database.fields.filter(
                (field): field is RelationFieldAttributes => field.type === 'relation'
            ),
        [database.fields]
    );

    const selectedRelationField = relationFields.find(
        (field) => field.id === relationFieldId
    );
    const targetDatabaseId = selectedRelationField?.databaseId ?? null;

    const targetDatabaseQuery = useLiveQuery(
        (q) =>
            q
                .from({ nodes: workspace.collections.nodes })
                .where(({ nodes }) => eq(nodes.id, targetDatabaseId ?? '')),
        [workspace.userId, targetDatabaseId]
    );

    const targetFields = useMemo(() => {
        const node = targetDatabaseQuery.data[0];
        if (!node || node.type !== 'database') {
            return [] as FieldAttributes[];
        }

        return Object.values(node.fields ?? {});
    }, [targetDatabaseQuery.data]);

    return (
        <div className="flex flex-col gap-4">
            <Field>
                <FieldLabel>Relation field</FieldLabel>
                <FieldSelect
                    fields={relationFields}
                    value={relationFieldId ?? null}
                    onChange={(value) => onChangeRelationField(value)}
                />
                {relationFields.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                        Create a relation field first to use a rollup.
                    </p>
                )}
            </Field>
            <Field>
                <FieldLabel>Aggregation</FieldLabel>
                <AggregationSelect value={aggregation} onChange={onChangeAggregation} />
            </Field>
            {aggregation && aggregation !== 'count' && targetDatabaseId && (
                <Field>
                    <FieldLabel>Field to aggregate</FieldLabel>
                    <FieldSelect
                        fields={targetFields}
                        value={rolledUpFieldId ?? null}
                        onChange={(value) => onChangeRolledUpField(value)}
                    />
                </Field>
            )}
        </div>
    );
};
