import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { LocalPageNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
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
import { useWorkspaceSpaces } from '@colanode/ui/hooks/use-workspace-spaces';
import { useWorkspace } from '@colanode/ui/contexts/workspace';

interface MetaTypePageCreateDialogProps {
  metaTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MetaTypePageCreateDialog = ({
  metaTypeId,
  open,
  onOpenChange,
}: MetaTypePageCreateDialogProps) => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });
  const { spaces } = useWorkspaceSpaces();
  const [spaceId, setSpaceId] = useState('');

  useEffect(() => {
    if (spaces.length > 0 && !spaceId) {
      setSpaceId(spaces[0]!.id);
    }
  }, [spaces, spaceId]);

  const { mutate } = useMutation({
    mutationFn: async (values: PageFormValues) => {
      if (!spaceId) {
        throw new Error('Select a space for the new page.');
      }

      const pageId = generateId(IdType.Page);
      const nodes = workspace.collections.nodes;

      const page: LocalPageNode = {
        id: pageId,
        type: 'page',
        name: values.name,
        avatar: values.avatar,
        parentId: spaceId,
        metaTypeId,
        fields: {},
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
            Create a new page with this meta type in a space.
          </DialogDescription>
        </DialogHeader>
        {spaces.length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="meta-type-page-space">Space</Label>
            <select
              id="meta-type-page-space"
              className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={spaceId}
              onChange={(event) => setSpaceId(event.target.value)}
            >
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Create a space before adding pages.
          </p>
        )}
        <PageForm
          id={generateId(IdType.Page)}
          values={{
            name: '',
          }}
          submitText="Create"
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => mutate(values)}
        />
      </DialogContent>
    </Dialog>
  );
};
