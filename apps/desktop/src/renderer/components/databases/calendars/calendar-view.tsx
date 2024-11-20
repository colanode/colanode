import React from 'react';
import { ViewTabs } from '@/renderer/components/databases/view-tabs';
import { useDatabase } from '@/renderer/contexts/database';
import { CalendarViewGrid } from '@/renderer/components/databases/calendars/calendar-view-grid';
import { ViewSearchBar } from '@/renderer/components/databases/search/view-search-bar';
import { ViewSortButton } from '@/renderer/components/databases/search/view-sort-button';
import { ViewFilterButton } from '@/renderer/components/databases/search/view-filter-button';
import { useView } from '@/renderer/contexts/view';
import { CalendarViewSettings } from '@/renderer/components/databases/calendars/calendar-view-settings';

export const CalendarView = () => {
  const database = useDatabase();
  const view = useView();

  const groupByField = database.fields.find(
    (field) => field.id === view.groupBy
  );

  if (!groupByField) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="mt-2 flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <CalendarViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        <CalendarViewGrid field={groupByField} />
      </div>
    </React.Fragment>
  );
};
