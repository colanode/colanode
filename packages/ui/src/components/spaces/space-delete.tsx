import { useState } from 'react';

import { NodeDeleteDialog } from '@colanode/ui/components/nodes/node-delete-dialog';
import { Button } from '@colanode/ui/components/ui/button';

interface SpaceDeleteProps {
  spaceId: string;
}

export const SpaceDelete = ({ spaceId }: SpaceDeleteProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">Delete space</h3>
          <p className="text-sm text-muted-foreground">
            Once you delete a space, there is no going back. Please be certain.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="destructive"
            onClick={() => {
              setShowDeleteModal(true);
            }}
            className="w-20"
          >
            Delete
          </Button>
        </div>
      </div>
      <NodeDeleteDialog
        id={spaceId}
        title="Are you sure you want delete this space?"
        description="This action cannot be undone. This space will no longer be accessible by you or others you've shared it with."
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      />
    </>
  );
};
