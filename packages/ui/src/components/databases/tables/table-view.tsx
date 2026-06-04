import { Fragment } from 'react';

import {
  MultiSelectFieldAttributes,
  SelectFieldAttributes,
} from '@colanode/core';
import { ViewFilterButton } from '@colanode/ui/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@colanode/ui/components/databases/search/view-search-bar';
import { ViewSortButton } from '@colanode/ui/components/databases/search/view-sort-button';
import { TableViewBody } from '@colanode/ui/components/databases/tables/table-view-body';
import { TableViewGrouped } from '@colanode/ui/components/databases/tables/table-view-grouped';
import { TableViewHeader } from '@colanode/ui/components/databases/tables/table-view-header';
import { TableViewRecordCreateRow } from '@colanode/ui/components/databases/tables/table-view-record-create-row';
import { TableViewSettings } from '@colanode/ui/components/databases/tables/table-view-settings';
import { ViewFullscreenButton } from '@colanode/ui/components/databases/view-fullscreen-button';
import { ViewTabs } from '@colanode/ui/components/databases/view-tabs';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const TableView = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  const groupByField = database.fields.find(
    (field) => field.id === view.groupBy
  );
  const isGrouped =
    groupByField?.type === 'select' ||
    groupByField?.type === 'multi_select';

  return (
    <Fragment>
      <div className="flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <ViewFullscreenButton />
          <TableViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <TableViewHeader />
        {isGrouped ? (
          <TableViewGrouped
            field={
              groupByField as
              | SelectFieldAttributes
              | MultiSelectFieldAttributes
            }
          />
        ) : (
          <Fragment>
            <TableViewBody />
            <TableViewRecordCreateRow />
          </Fragment>
        )}
      </div>
    </Fragment>
  );
};
