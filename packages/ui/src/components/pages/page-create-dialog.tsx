import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LocalPageNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { resolveInitialPageFields } from '@colanode/ui/lib/page-field-values';
import {
  PageForm,
  PageFormValues,
} from '@colanode/ui/components/pages/page-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { Label } from '@colanode/ui/components/ui/label';
import { useMetaTypeDatabases } from '@colanode/ui/hooks/use-meta-type-databases';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface PageCreateDialogProps {
  spaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMetaTypeId?: string;
}

export const PageCreateDialog = ({
  spaceId,
  open,
  onOpenChange,
  defaultMetaTypeId,
}: PageCreateDialogProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { metaTypes, defaultPageMetaType } = useMetaTypeDatabases();
  const [metaTypeId, setMetaTypeId] = useState(
    defaultMetaTypeId ?? defaultPageMetaType?.id ?? ''
  );

  useEffect(() => {
    const resolved =
      defaultMetaTypeId ?? defaultPageMetaType?.id ?? metaTypes[0]?.id ?? '';
    if (resolved) {
      setMetaTypeId(resolved);
    }
  }, [defaultMetaTypeId, defaultPageMetaType?.id, metaTypes]);

  const { mutate } = useMutation({
    mutationFn: async (values: PageFormValues) => {
      const resolvedMetaTypeId =
        metaTypeId || defaultPageMetaType?.id || metaTypes[0]?.id;

      if (!resolvedMetaTypeId) {
        throw new Error('No page meta type is available.');
      }

      const resolvedMetaType =
        metaTypes.find((metaType) => metaType.id === resolvedMetaTypeId) ??
        null;

      const pageId = generateId(IdType.Page);
      const nodes = workspace.collections.nodes;

      const page: LocalPageNode = {
        id: pageId,
        type: 'page',
        name: values.name,
        avatar: values.avatar,
        parentId: spaceId,
        metaTypeId: resolvedMetaTypeId,
        fields: resolveInitialPageFields(resolvedMetaType),
        rootId: spaceId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };

      nodes.insert(page);
      return page;
    },
    onSuccess: (page) => {
      navigate({
        to: '$nodeId',
        params: {
          nodeId: page.id,
        },
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create page</DialogTitle>
          <DialogDescription>
            Create a new page to collaborate with your peers
          </DialogDescription>
        </DialogHeader>
        {metaTypes.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="page-meta-type">Meta type</Label>
            <select
              id="page-meta-type"
              className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={metaTypeId || defaultPageMetaType?.id}
              onChange={(event) => setMetaTypeId(event.target.value)}
            >
              {metaTypes.map((metaType) => (
                <option key={metaType.id} value={metaType.id}>
                  {metaType.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <PageForm
          id={generateId(IdType.Page)}
          values={{
            name: '',
          }}
          submitText="Create"
          onCancel={() => {
            onOpenChange(false);
          }}
          onSubmit={(values) => mutate(values)}
        />
      </DialogContent>
    </Dialog>
  );
};
