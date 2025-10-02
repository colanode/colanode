import { Home } from 'lucide-react';

import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

export const WorkspaceHomeScreen = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem
          icon={(className) => <Home className={className} />}
          name="Home"
        />
      </Breadcrumb>
      <div className="h-full w-full flex flex-col gap-1">
        <div className="h-10 app-drag-region"></div>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            What did you get done this week?
          </p>
        </div>
      </div>
    </>
  );
};
