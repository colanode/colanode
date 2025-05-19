import { Filter } from 'lucide-react';

import { ViewFilterAddPopover } from '@colanode/ui/components/databases/search/view-filter-add-popover';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const ViewFilterButton = () => {
  const view = useDatabaseView();

  if (view.filters.length > 0) {
    return (
      <button
        className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50"
        onClick={() => view.openSearchBar()}
      >
        <Filter className="size-4" />
      </button>
    );
  }

  return (
    <ViewFilterAddPopover>
      <button className="flex cursor-pointer items-center rounded-md p-1.5 hover:bg-gray-50">
        <Filter className="size-4" />
      </button>
    </ViewFilterAddPopover>
  );
};
