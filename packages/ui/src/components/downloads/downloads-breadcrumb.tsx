import { Download } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from '@colanode/ui/components/ui/breadcrumb';

export const DownloadsBreadcrumb = () => {
  return (
    <Breadcrumb className="flex-grow">
      <BreadcrumbList>
        <BreadcrumbItem className="cursor-pointer hover:text-foreground">
          <div className="flex items-center space-x-2">
            <Download className="size-5" />
            <span>Downloads</span>
          </div>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
