import { useLiveQuery } from '@tanstack/react-db';
import { useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

import { collections } from '@colanode/ui/collections';
import { Button } from '@colanode/ui/components/ui/button';

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
    <Button
      variant="ghost"
      size="icon"
      className="absolute left-5 top-5"
      type="button"
      onClick={() => {
        router.navigate({
          to: '/workspace/$userId',
          params: { userId: workspaces[0]!.userId },
        });
      }}
    >
      <ArrowLeft className="size-4" />
    </Button>
  );
};
