import { FieldAttributes } from '@colanode/core';
import { SmartTextInput } from '@colanode/ui/components/ui/smart-text-input';
import { useDatabase } from '@colanode/ui/contexts/database';

interface FieldRenameInputProps {
  field: FieldAttributes;
}

export const FieldRenameInput = ({ field }: FieldRenameInputProps) => {
  const database = useDatabase();

  return (
    <div className="w-full p-1">
      <SmartTextInput
        value={field.name}
        readOnly={!database.canEdit}
        onChange={(newName) => {
          if (newName === field.name) return;
          database.renameField(field.id, newName);
        }}
      />
    </div>
  );
};
