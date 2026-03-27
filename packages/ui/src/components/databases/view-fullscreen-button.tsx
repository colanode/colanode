import { Fullscreen } from 'lucide-react';

import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseViews } from '@colanode/ui/contexts/database-views';
import { useNavigation } from '@colanode/ui/contexts/navigation';

export const ViewFullscreenButton = () => {
  const database = useDatabase();
  const views = useDatabaseViews();
  const navigation = useNavigation();

  if (!views.inline) {
    return null;
  }

  return (
    <button
      type="button"
      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-accent"
      onClick={() => navigation.openNode(database.id, 'database')}
    >
      <Fullscreen className="size-4" />
    </button>
  );
};
