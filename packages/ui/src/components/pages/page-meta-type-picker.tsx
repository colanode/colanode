import { LocalPageNode } from '@colanode/client/types';
import { Label } from '@colanode/ui/components/ui/label';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMetaTypeDatabases } from '@colanode/ui/hooks/use-meta-type-databases';

interface PageMetaTypePickerProps {
  page: LocalPageNode;
  canEdit: boolean;
}

export const PageMetaTypePicker = ({
  page,
  canEdit,
}: PageMetaTypePickerProps) => {
  const workspace = useWorkspace();
  const { metaTypes, isLoading } = useMetaTypeDatabases();

  if (isLoading || metaTypes.length === 0) {
    return null;
  }

  const currentMetaType =
    metaTypes.find((metaType) => metaType.id === page.metaTypeId) ?? null;

  const handleChange = (metaTypeId: string) => {
    if (!canEdit || metaTypeId === page.metaTypeId) {
      return;
    }

    workspace.collections.nodes.update(page.id, (draft) => {
      if (draft.type !== 'page') {
        return;
      }

      draft.metaTypeId = metaTypeId;
    });
  };

  if (!canEdit || metaTypes.length === 1) {
    return (
      <div className="mb-2 space-y-1">
        <Label className="text-xs text-muted-foreground">Meta type</Label>
        <p className="text-sm">{currentMetaType?.name ?? 'Unknown'}</p>
      </div>
    );
  }

  return (
    <div className="mb-2 space-y-1">
      <Label htmlFor="page-meta-type-picker" className="text-xs text-muted-foreground">
        Meta type
      </Label>
      <select
        id="page-meta-type-picker"
        className="border-input flex h-8 w-full max-w-xs rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        value={page.metaTypeId}
        onChange={(event) => handleChange(event.target.value)}
      >
        {metaTypes.map((metaType) => (
          <option key={metaType.id} value={metaType.id}>
            {metaType.name}
          </option>
        ))}
      </select>
    </div>
  );
};
