import React from 'react';
import { TableViewHeader } from '@/renderer/components/databases/tables/table-view-header';
import { TableViewBody } from '@/renderer/components/databases/tables/table-view-body';
import { TableViewRecordCreateRow } from '@/renderer/components/databases/tables/table-view-record-create-row';
import { ViewTabs } from '@/renderer/components/databases/view-tabs';
import { TableViewSettings } from '@/renderer/components/databases/tables/table-view-settings';
import { ViewSearchBar } from '@/renderer/components/databases/search/view-search-bar';
import { ViewFilterButton } from '@/renderer/components/databases/search/view-filter-button';
import { ViewSortButton } from '@/renderer/components/databases/search/view-sort-button';

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
