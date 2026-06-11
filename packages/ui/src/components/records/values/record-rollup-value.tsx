import { inArray, useLiveQuery } from '@tanstack/react-db';
import { useMemo } from 'react';

import { LocalPageNode, LocalRecordNode } from '@colanode/client/types';
import { RollupFieldAttributes } from '@colanode/core';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface RecordRollupValueProps {
    field: RollupFieldAttributes;
}

const formatNumber = (value: number): string => {
    if (!Number.isFinite(value)) {
        return '';
    }

    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

export const RecordRollupValue = ({ field }: RecordRollupValueProps) => {
    const workspace = useWorkspace();
    const database = useDatabase();
    const record = useRecord();

    const relationField = database.fields.find(
        (item) => item.id === field.relationFieldId
    );

    const relationIds = useMemo(() => {
        if (!field.relationFieldId) {
            return [] as string[];
        }

        const value = record.fields[field.relationFieldId];
        if (value && value.type === 'string_array') {
            return value.value;
        }

        return [] as string[];
    }, [record.fields, field.relationFieldId]);

    const needsRecords = field.aggregation !== 'count' && relationIds.length > 0;

    const recordsQuery = useLiveQuery(
        (q) =>
            q
                .from({ nodes: workspace.collections.nodes })
                .where(({ nodes }) =>
                    inArray(nodes.id, needsRecords ? relationIds : [''])
                ),
        [workspace.userId, needsRecords, relationIds]
    );

    const result = useMemo(() => {
        if (!field.relationFieldId || !field.aggregation) {
            return null;
        }

        if (field.aggregation === 'count') {
            return relationIds.length;
        }

        if (!field.rolledUpFieldId) {
            return null;
        }

        const numbers: number[] = [];
        for (const node of recordsQuery.data) {
            if (node.type !== 'record' && node.type !== 'page') {
                continue;
            }

            const fields =
                node.type === 'record'
                    ? (node as LocalRecordNode).fields
                    : (node as LocalPageNode).fields;
            const value = fields?.[field.rolledUpFieldId];
            if (value && value.type === 'number') {
                numbers.push(value.value);
            }
        }

        if (numbers.length === 0) {
            return 0;
        }

        switch (field.aggregation) {
            case 'sum':
                return numbers.reduce((acc, n) => acc + n, 0);
            case 'average':
                return numbers.reduce((acc, n) => acc + n, 0) / numbers.length;
            case 'min':
                return Math.min(...numbers);
            case 'max':
                return Math.max(...numbers);
            default:
                return null;
        }
    }, [
        field.relationFieldId,
        field.rolledUpFieldId,
        field.aggregation,
        relationIds,
        recordsQuery.data,
    ]);

    if (!relationField || result === null) {
        return (
            <div className="h-full w-full p-0 text-sm text-muted-foreground"> </div>
        );
    }

    return (
        <div className="h-full w-full p-0 text-sm">{formatNumber(result)}</div>
    );
};
