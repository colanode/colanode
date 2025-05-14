import { ViewCreateButton } from '@colanode/ui/components/databases/view-create-button';
import { ViewTab } from '@colanode/ui/components/databases/view-tab';
import { useDatabase } from '@colanode/ui/contexts/database';
import { useDatabaseViews } from '@colanode/ui/contexts/database-views';

export const ViewTabs = () => {
  const database = useDatabase();
  const databaseViews = useDatabaseViews();

  return (
    <div className="flex flex-row items-center gap-3">
      {databaseViews.views.map((view) => (
        <ViewTab
          key={view.id}
          view={view}
          isActive={view.id === databaseViews.activeViewId}
          onClick={() => databaseViews.setActiveViewId(view.id)}
        />
      ))}
      {database.canEdit && <ViewCreateButton />}
    </div>
  );
};
