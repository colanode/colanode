import { LocalDatabaseViewNode } from '@colanode/client/types';
import { ViewIcon } from '@colanode/ui/components/databases/view-icon';
import { cn } from '@colanode/ui/lib/utils';

interface ViewTabProps {
  view: LocalDatabaseViewNode;
  isActive: boolean;
  onClick: () => void;
}

export const ViewTab = ({ view, isActive, onClick }: ViewTabProps) => {
  return (
    <div
      role="presentation"
      className={cn(
        'inline-flex cursor-pointer flex-row items-center gap-1 border-b-2 p-1 pl-0 text-sm',
        isActive ? 'border-gray-500' : 'border-transparent'
      )}
      onClick={() => onClick()}
      onKeyDown={() => onClick()}
    >
      <ViewIcon
        id={view.id}
        name={view.attributes.name}
        avatar={view.attributes.avatar}
        layout={view.attributes.layout}
        className="size-4"
      />
      {view.attributes.name}
    </div>
  );
};
