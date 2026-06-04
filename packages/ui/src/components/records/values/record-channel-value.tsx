import { ChannelFieldAttributes } from '@colanode/core';
import { RecordNodeReferenceValue } from '@colanode/ui/components/records/values/record-node-reference-value';

interface RecordChannelValueProps {
    field: ChannelFieldAttributes;
    readOnly?: boolean;
}

export const RecordChannelValue = ({
    field,
    readOnly,
}: RecordChannelValueProps) => {
    return (
        <RecordNodeReferenceValue
            field={field}
            allowedTypes={['channel']}
            readOnly={readOnly}
            placeholder="Search channels..."
        />
    );
};
