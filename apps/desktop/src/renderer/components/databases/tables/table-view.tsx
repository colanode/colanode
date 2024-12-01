import React from 'react';

import { ViewFilterButton } from '@/renderer/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@/renderer/components/databases/search/view-search-bar';
import { ViewSortButton } from '@/renderer/components/databases/search/view-sort-button';
import { TableViewBody } from '@/renderer/components/databases/tables/table-view-body';
import { TableViewHeader } from '@/renderer/components/databases/tables/table-view-header';
import { TableViewRecordCreateRow } from '@/renderer/components/databases/tables/table-view-record-create-row';
import { TableViewSettings } from '@/renderer/components/databases/tables/table-view-settings';
import { ViewTabs } from '@/renderer/components/databases/view-tabs';

export const TableView = () => {
  return (
    <React.Fragment>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <TableViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <TableViewHeader />
        <TableViewBody />
        <TableViewRecordCreateRow />
      </div>
    </React.Fragment>
  );
};
