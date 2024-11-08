import { useMutation } from '@/renderer/hooks/use-mutation';
import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useRecord } from '@/renderer/contexts/record';

export const RecordName = () => {
  const workspace = useWorkspace();
  const record = useRecord();
  const { mutate, isPending } = useMutation();

  return (
    <SmartTextInput
      value={record.name}
      onChange={(value) => {
        if (isPending) {
          return;
        }

        if (value === record.name) {
          return;
        }

        mutate({
          input: {
            type: 'node_attribute_set',
            nodeId: record.id,
            path: 'name',
            value: value,
            userId: workspace.userId,
          },
        });
      }}
      className="font-heading border-b border-none pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};