import { MentionTargetType } from '@colanode/client/types';
import { ResourceFieldAttributes } from '@colanode/core';
import { RecordNodeReferenceValue } from '@colanode/ui/components/records/values/record-node-reference-value';

const DEFAULT_RESOURCE_TYPES: MentionTargetType[] = [
    'channel',
    'page',
    'database',
    'folder',
    'file',
    'record',
    'chat',
    'user',
];

interface RecordResourceValueProps {
    field: ResourceFieldAttributes;
    readOnly?: boolean;
}

export const RecordResourceValue = ({
    field,
    readOnly,
}: RecordResourceValueProps) => {
    const allowedTypes = field.allowedTypes?.length
        ? (field.allowedTypes as MentionTargetType[])
        : DEFAULT_RESOURCE_TYPES;

    return (
        <RecordNodeReferenceValue
            field={field}
            allowedTypes={allowedTypes}
            readOnly={readOnly}
            placeholder="Search resources..."
        />
    );
};
