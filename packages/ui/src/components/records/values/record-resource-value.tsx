import { MentionTargetType } from '@colanode/client/types';
import { ResourceFieldAttributes } from '@colanode/core';
import { RecordNodeReferenceValue } from '@colanode/ui/components/records/values/record-node-reference-value';

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
        : undefined;

    return (
        <RecordNodeReferenceValue
            field={field}
            allowedTypes={allowedTypes}
            readOnly={readOnly}
            placeholder="Search resources..."
        />
    );
};
