import { Fragment } from 'react';

import { BoardViewColumn } from '@colanode/ui/components/databases/boards/board-view-column';
import { BoardViewSettings } from '@colanode/ui/components/databases/boards/board-view-settings';
import { ViewFilterButton } from '@colanode/ui/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@colanode/ui/components/databases/search/view-search-bar';
import { ViewSortButton } from '@colanode/ui/components/databases/search/view-sort-button';
import { ViewTabs } from '@colanode/ui/components/databases/view-tabs';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const BoardView = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  const groupByField = database.fields.find(
    (field) => field.id === view.groupBy
  );

  const selectOptions =
    groupByField && groupByField.type === 'select'
      ? Object.values(groupByField.options ?? {})
      : [];

  return (
    <Fragment>
      <div className="flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <BoardViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 flex w-full min-w-full max-w-full flex-row gap-2 overflow-auto pr-5">
        {groupByField &&
          groupByField.type === 'select' &&
          selectOptions.map((option) => {
            return (
              <BoardViewColumn
                key={option.id}
                field={groupByField}
                option={option}
              />
            );
          })}
      </div>
    </Fragment>
  );
};
