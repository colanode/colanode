import { useLiveQuery } from '@tanstack/react-db';
import { useRouter } from '@tanstack/react-router';
import { HouseIcon } from 'lucide-react';

import { collections } from '@colanode/ui/collections';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';

export const AuthCancel = () => {
  const router = useRouter();

  const workspacesQuery = useLiveQuery((q) =>
    q.from({ workspaces: collections.workspaces }).select(({ workspaces }) => ({
      userId: workspaces.userId,
    }))
  );
  const workspaces = workspacesQuery.data;

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Separator className="w-full" />
      <Button
        variant="link"
        className="w-full text-muted-foreground"
        type="button"
        onClick={() => {
          router.navigate({
            to: '/workspace/$userId',
            params: { userId: workspaces[0]!.userId },
          });
        }}
      >
        <HouseIcon className="mr-1 size-4" />
        Back to workspace
      </Button>
    </div>
  );
};
