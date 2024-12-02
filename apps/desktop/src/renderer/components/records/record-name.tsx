import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useRecord } from '@/renderer/contexts/record';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';

export const RecordName = () => {
  const workspace = useWorkspace();
  const record = useRecord();
  const { mutate, isPending } = useMutation();

  return (
    <SmartTextInput
      value={record.name}
      readOnly={!record.canEdit}
      onChange={(value) => {
        if (isPending) {
          return;
        }

        if (value === record.name) {
          return;
        }

        mutate({
          input: {
            type: 'record_name_update',
            recordId: record.id,
            name: value,
            userId: workspace.userId,
          },
        });
      }}
      className="font-heading border-b border-none pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
