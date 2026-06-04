import { eq, inArray, useLiveQuery } from '@tanstack/react-db';
import { X } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';

import { LocalNode, MentionTargetType } from '@colanode/client/types';
import { StringArrayFieldValue } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { NodeReferenceSearch } from '@colanode/ui/components/records/node-reference-search';
import { Badge } from '@colanode/ui/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { Separator } from '@colanode/ui/components/ui/separator';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useRecordField } from '@colanode/ui/hooks/use-record-field';

interface NodeReferenceBadgeProps {
    node: LocalNode;
}

const NodeReferenceBadge = ({ node }: NodeReferenceBadgeProps) => {
    const name = ('name' in node && (node as { name?: string }).name) || 'Untitled';
    const avatar =
        'avatar' in node ? (node as { avatar?: string | null }).avatar : null;
    return (
        <div className="flex flex-row items-center gap-1 min-w-0">
            <Avatar id={node.id} name={name} avatar={avatar ?? null} size="small" />
            <p className="text-sm line-clamp-1 truncate">{name}</p>
        </div>
    );
};

interface RecordNodeReferenceValueProps {
    field: {
        id: string;
        type: 'resource';
        name: string;
        index: string;
    };
    allowedTypes?: MentionTargetType[];
    readOnly?: boolean;
    placeholder?: string;
}

export const RecordNodeReferenceValue = ({
    field,
    allowedTypes,
    readOnly,
    placeholder,
}: RecordNodeReferenceValueProps) => {
    const workspace = useWorkspace();
    const record = useRecord();
    const { value, setValue, clearValue } = useRecordField<StringArrayFieldValue>(
        { field }
    );

    const [open, setOpen] = useState(false);

    const referenceIds = useMemo(() => value?.value ?? [], [value]);
    const referencesQuery = useLiveQuery(
        (q) => {
            if (referenceIds.length === 0) {
                return q
                    .from({ nodes: workspace.collections.nodes })
                    .where(({ nodes }) => eq(nodes.id, ''));
            }

            return q
                .from({ nodes: workspace.collections.nodes })
                .where(({ nodes }) => inArray(nodes.id, referenceIds));
        },
        [workspace.userId, referenceIds]
    );

    const references = referencesQuery.data as LocalNode[];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="flex h-full w-full cursor-pointer flex-wrap gap-1 p-0 overflow-hidden">
                    {references.slice(0, 1).map((reference) => (
                        <NodeReferenceBadge key={reference.id} node={reference} />
                    ))}
                    {references.length === 0 && ' '}
                    {references.length > 1 && (
                        <Badge
                            variant="outline"
                            className="ml-2 text-xs px-1 text-muted-foreground"
                        >
                            +{references.length - 1}
                        </Badge>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1">
                <div className="flex flex-col flex-wrap gap-2 p-2">
                    {references.length > 0 ? (
                        <Fragment>
                            {references.map((reference) => (
                                <div
                                    key={reference.id}
                                    className="flex w-full flex-row items-center gap-2"
                                >
                                    <NodeReferenceBadge node={reference} />
                                    {record.canEdit && !readOnly && (
                                        <X
                                            className="size-4 cursor-pointer ml-auto"
                                            onClick={() => {
                                                if (!record.canEdit || readOnly) return;

                                                const newRefs = referenceIds.filter(
                                                    (id) => id !== reference.id
                                                );

                                                if (newRefs.length === 0) {
                                                    clearValue();
                                                } else {
                                                    setValue({
                                                        type: 'string_array',
                                                        value: newRefs,
                                                    });
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                            <Separator className="w-full my-2" />
                        </Fragment>
                    ) : (
                        <p className="text-sm text-muted-foreground">No references</p>
                    )}
                </div>
                {record.canEdit && !readOnly && (
                    <NodeReferenceSearch
                        exclude={referenceIds}
                        allowedTypes={allowedTypes}
                        placeholder={placeholder}
                        onSelect={(item) => {
                            if (!record.canEdit || readOnly) return;

                            const newRefs = referenceIds.includes(item.id)
                                ? referenceIds.filter((id) => id !== item.id)
                                : [...referenceIds, item.id];

                            if (newRefs.length === 0) {
                                clearValue();
                            } else {
                                setValue({
                                    type: 'string_array',
                                    value: newRefs,
                                });
                            }

                            setOpen(false);
                        }}
                    />
                )}
            </PopoverContent>
        </Popover>
    );
};
