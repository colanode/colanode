import React from 'react';
import { SpaceCreateButton } from '@/components/spaces/space-create-button';
import { SidebarSpaceNode } from '@/types/workspaces';
import { SidebarSpaceItem } from '@/components/workspaces/sidebars/sidebar-space-item';

interface SidebarSpacesProps {
  spaces: SidebarSpaceNode[];
}

export const SidebarSpaces = ({ spaces }: SidebarSpacesProps) => {
  return (
    <div className="pt-2 first:pt-0">
      <div className="flex items-center justify-between p-1 pb-2 text-xs text-muted-foreground">
        <span>Spaces</span>
        <SpaceCreateButton />
      </div>
      <div className="flex flex-col gap-0.5">
        {spaces.map((space) => (
          <SidebarSpaceItem node={space} key={space.id} />
        ))}
      </div>
    </div>
  );
};