import { Link } from '@tanstack/react-router';
import { Fullscreen } from 'lucide-react';

import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseViews } from '@colanode/ui/contexts/database-views';

export const ViewFullscreenButton = () => {
  const database = useDatabase();
  const views = useDatabaseViews();

  if (!views.inline) {
    return null;
  }

  return (
    <Link
      from="/acc/$accountId/$workspaceId"
      to="$nodeId"
      params={{ nodeId: database.id }}
      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-accent"
    >
      <Fullscreen className="size-4" />
    </Link>
  );
};
