import { Fragment } from 'react';

import { CalendarViewGrid } from '@colanode/ui/components/databases/calendars/calendar-view-grid';
import { CalendarViewNoGroup } from '@colanode/ui/components/databases/calendars/calendar-view-no-group';
import { CalendarViewSettings } from '@colanode/ui/components/databases/calendars/calendar-view-settings';
import { ViewFilterButton } from '@colanode/ui/components/databases/search/view-filter-button';
import { ViewSearchBar } from '@colanode/ui/components/databases/search/view-search-bar';
import { ViewSortButton } from '@colanode/ui/components/databases/search/view-sort-button';
import { ViewTabs } from '@colanode/ui/components/databases/view-tabs';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseView } from '@colanode/ui/contexts/database-view';

export const CalendarView = () => {
  const database = useDatabase();
  const view = useDatabaseView();

  const groupByField = database.fields.find(
    (field) => field.id === view.groupBy
  );

  return (
    <Fragment>
      <div className="flex flex-row justify-between border-b">
        <ViewTabs />
        <div className="invisible flex flex-row items-center justify-end group-hover/database:visible">
          <CalendarViewSettings />
          <ViewSortButton />
          <ViewFilterButton />
        </div>
      </div>
      <ViewSearchBar />
      <div className="mt-2 w-full min-w-full max-w-full overflow-auto pr-5">
        {groupByField ? (
          <CalendarViewGrid field={groupByField} />
        ) : (
          <CalendarViewNoGroup />
        )}
      </div>
    </Fragment>
  );
};
