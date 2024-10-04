import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/renderer/components/ui/avatar';
import { ViewNode } from '@/types/databases';

interface ViewTabProps {
  view: ViewNode;
  isActive: boolean;
  onClick: () => void;
}

export const ViewTab = ({ view, isActive, onClick }: ViewTabProps) => {
  return (
    <div
      role="presentation"
      className={cn(
        'inline-flex cursor-pointer flex-row items-center gap-1 border-b-2 p-1 pl-0 text-sm',
        isActive ? 'border-gray-500' : 'border-transparent',
      )}
      onClick={() => onClick()}
      onKeyDown={() => onClick()}
    >
      <Avatar id={view.id} name={view.name} size="small" />
      {view.name}
    </div>
  );
};