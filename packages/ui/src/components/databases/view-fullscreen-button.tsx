import { Fullscreen } from 'lucide-react';

import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseViews } from '@colanode/ui/contexts/database-views';
import { useLayout } from '@colanode/ui/contexts/layout';

export const ViewFullscreenButton = () => {
  const database = useDatabase();
  const views = useDatabaseViews();
  const layout = useLayout();

  if (!views.inline) {
    return null;
  }

  return (
    <button
      className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
      onClick={() => layout.previewLeft(database.id, true)}
    >
      <Fullscreen className="size-4" />
    </button>
  );
};
