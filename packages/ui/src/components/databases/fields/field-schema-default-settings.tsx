import { Check } from 'lucide-react';

import {
  compareString,
  MultiSelectFieldAttributes,
  SelectFieldAttributes,
} from '@colanode/core';
import { SelectOptionBadge } from '@colanode/ui/components/databases/fields/select-option-badge';
import { Label } from '@colanode/ui/components/ui/label';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { cn } from '@colanode/ui/lib/utils';

interface FieldSchemaDefaultSettingsProps {
  field: SelectFieldAttributes | MultiSelectFieldAttributes;
}

export const FieldSchemaDefaultSettings = ({
  field,
}: FieldSchemaDefaultSettingsProps) => {
  const workspace = useWorkspace();
  const database = useDatabase();

  const options = Object.values(field.options ?? {}).sort((left, right) =>
    compareString(left.index, right.index)
  );

  if (!database.canEdit || database.isLocked) {
    return null;
  }

  if (options.length === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        Add options before setting a default.
      </p>
    );
  }

  const updateField = (
    updater: (
      draft: SelectFieldAttributes | MultiSelectFieldAttributes
    ) => void
  ) => {
    workspace.collections.nodes.update(database.id, (draft) => {
      if (draft.type !== 'database') {
        return;
      }

      const fieldAttributes = draft.fields[field.id];
      if (
        !fieldAttributes ||
        (fieldAttributes.type !== 'select' &&
          fieldAttributes.type !== 'multi_select')
      ) {
        return;
      }

      updater(fieldAttributes);
    });
  };

  if (field.type === 'select') {
    return (
      <div className="space-y-1 px-1">
        <Label htmlFor={`field-default-${field.id}`}>Default value</Label>
        <select
          id={`field-default-${field.id}`}
          className="border-input flex h-8 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          value={field.default ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            updateField((draft) => {
              if (value.length === 0) {
                delete draft.default;
                return;
              }

              draft.default = value;
            });
          }}
        >
          <option value="">No default</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const selectedDefaults = field.default ?? [];

  return (
    <div className="space-y-1 px-1">
      <Label>Default values</Label>
      <div className="flex flex-col gap-1">
        {options.map((option) => {
          const isSelected = selectedDefaults.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                'flex w-full cursor-pointer flex-row items-center gap-2 rounded-md p-1 text-left hover:bg-accent',
                isSelected && 'bg-accent/60'
              )}
              onClick={() => {
                updateField((draft) => {
                  if (draft.type !== 'multi_select') {
                    return;
                  }

                  const current = draft.default ?? [];
                  const next = current.includes(option.id)
                    ? current.filter((id) => id !== option.id)
                    : [...current, option.id];

                  if (next.length === 0) {
                    delete draft.default;
                    return;
                  }

                  draft.default = next;
                });
              }}
            >
              <SelectOptionBadge name={option.name} color={option.color} />
              {isSelected ? (
                <Check className="ml-auto size-4" />
              ) : (
                <span className="ml-auto size-4" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
