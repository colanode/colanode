import { match } from 'ts-pattern';

import { LocalDatabaseViewNode } from '@colanode/client/types';
import { BoardView } from '@colanode/ui/components/databases/boards/board-view';
import { CalendarView } from '@colanode/ui/components/databases/calendars/calendar-view';
import { TableView } from '@colanode/ui/components/databases/tables/table-view';
import { DatabaseViewContext } from '@colanode/ui/contexts/database-view';
import { useDatabaseViewValue } from '@colanode/ui/hooks/use-database-view-value';

interface ViewProps {
  view: LocalDatabaseViewNode;
}

export const View = ({ view }: ViewProps) => {
  const contextValue = useDatabaseViewValue(view);

  return (
    <DatabaseViewContext.Provider value={contextValue}>
      <div className="w-full h-full group/database">
        {match(view.layout)
          .with('table', () => <TableView />)
          .with('board', () => <BoardView />)
          .with('calendar', () => <CalendarView />)
          .exhaustive()}
      </div>
    </DatabaseViewContext.Provider>
  );
};
