import { SmartTextInput } from '@/renderer/components/ui/smart-text-input';
import { useRecord } from '@/renderer/contexts/record';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

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
          onError(error) {
            toast({
              title: 'Failed to update record name',
              description: error.message,
              variant: 'destructive',
            });
          },
        });
      }}
      className="font-heading border-b border-none pl-1 text-4xl font-bold shadow-none focus-visible:ring-0"
      placeholder="Unnamed"
    />
  );
};
