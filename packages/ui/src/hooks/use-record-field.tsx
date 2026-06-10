import { FieldAttributes, FieldValue } from '@colanode/core';
import { useEntityField } from '@colanode/ui/hooks/use-entity-field';

interface Options {
  field: FieldAttributes;
}

export const useRecordField = <T extends FieldValue>({ field }: Options) => {
  return useEntityField<T>({ field });
};
