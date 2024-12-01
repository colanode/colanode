import React from 'react';

import { BoardViewColumn } from '@/renderer/components/databases/boards/board-view-column';
import { BoardViewSettings } from '@/renderer/components/databases/boards/board-view-settings';
import { ViewFilterButton } from '@/renderer/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@/renderer/components/databases/search/view-search-bar';
import { ViewSortButton } from '@/renderer/components/databases/search/view-sort-button';
import { ViewTabs } from '@/renderer/components/databases/view-tabs';
import { useDatabase } from '@/renderer/contexts/database';
import { useView } from '@/renderer/contexts/view';

export const BoardView = () => {
  const database = useDatabase();
  const view = useView();

  const groupByField = database.fields.find(
    (field) => field.id === view.groupBy
  );

  if (!groupByField || groupByField.type !== 'select') {
    return null;
  }

  const selectOptions = Object.values(groupByField.options ?? {});
  return (
    <React.Fragment>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <BoardViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 flex w-full min-w-full max-w-full flex-row gap-2 overflow-auto pr-5">
        {selectOptions.map((option) => {
          return (
            <BoardViewColumn
              key={option.id}
              field={groupByField}
              option={option}
            />
          );
        })}
      </div>
    </React.Fragment>
  );
};
