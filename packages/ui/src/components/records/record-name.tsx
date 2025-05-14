import { useEffect, useRef } from 'react';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useRecord } from '@colanode/ui/contexts/record';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { toast } from '@colanode/ui/hooks/use-toast';

export const RecordName = () => {
  const workspace = useWorkspace();
  const record = useRecord();
  const { mutate, isPending } = useMutation();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!record.canEdit) return;

    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [record.canEdit, inputRef]);

  return (
    <SmartTextInput
      value={record.name}
      readOnly={!record.canEdit}
      ref={inputRef}
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
            accountId: workspace.accountId,
            workspaceId: workspace.id,
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
