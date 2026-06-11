import { LocalPageNode } from '@colanode/client/types';
import { Label } from '@colanode/ui/components/ui/label';
import { useMetaTypeDatabases } from '@colanode/ui/hooks/use-meta-type-databases';

interface PageMetaTypePickerProps {
  page: LocalPageNode;
}

export const PageMetaTypePicker = ({ page }: PageMetaTypePickerProps) => {
  const { metaTypes, isLoading } = useMetaTypeDatabases();

  if (isLoading || metaTypes.length === 0) {
    return null;
  }

  const currentMetaType =
    metaTypes.find((metaType) => metaType.id === page.metaTypeId) ?? null;

  return (
    <div className="mb-2 space-y-1">
      <Label className="text-xs text-muted-foreground">Meta type</Label>
      <p className="text-sm">{currentMetaType?.name ?? 'Unknown'}</p>
    </div>
  );
};
