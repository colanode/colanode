import { Fullscreen } from 'lucide-react';

import { Link } from '@colanode/ui/components/ui/link';
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
      from="/workspace/$userId"
      to="$nodeId"
      params={{ nodeId: views.viewId ?? database.id }}
      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-accent"
    >
      <Fullscreen className="size-4" />
    </Link>
  );
};
