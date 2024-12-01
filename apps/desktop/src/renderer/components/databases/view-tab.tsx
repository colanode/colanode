import { ViewAttributes } from '@colanode/core';

import { ViewIcon } from '@/renderer/components/databases/view-icon';
import { cn } from '@/shared/lib/utils';

interface ViewTabProps {
  view: ViewAttributes;
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
        name={view.name}
        avatar={view.avatar}
        type={view.type}
        className="size-4"
      />
      {view.name}
    </div>
  );
};
