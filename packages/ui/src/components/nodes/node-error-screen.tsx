import { BadgeAlert } from 'lucide-react';

import { Breadcrumb } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/workspaces/breadcrumbs/breadcrumb-item';

export const NodeErrorScreen = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem
          icon={(className) => <BadgeAlert className={className} />}
          name="Node error"
        />
      </Breadcrumb>
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <BadgeAlert className="size-12 mb-4" />
        <h1 className="text-2xl font-semibold tracking-tight">Node error</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          The node you are looking for does not exist. It may have been deleted
          or your access has been removed.
        </p>
      </div>
    </>
  );
};
