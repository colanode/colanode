import { Outlet } from '@tanstack/react-router';

import { WorkspaceSidebar } from '@colanode/ui/components/workspaces/sidebars/workspace-sidebar';

export const WorkspaceLayout = () => {
  return (
    <div className="w-screen min-w-screen h-screen min-h-screen flex flex-row bg-background">
      <WorkspaceSidebar />
      <div className="h-full max-h-screen w-full flex-grow overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};
