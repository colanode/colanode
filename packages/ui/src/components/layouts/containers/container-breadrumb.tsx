import { Fragment } from 'react';

import { LocalNode } from '@colanode/client/types';
import { ContainerBreadcrumbItem } from '@colanode/ui/components/layouts/containers/container-breadcrumb-item';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@colanode/ui/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { useLayout } from '@colanode/ui/contexts/layout';

interface ContainerBreadcrumbProps {
  breadcrumb: LocalNode[];
}

export const ContainerBreadcrumb = ({
  breadcrumb,
}: ContainerBreadcrumbProps) => {
  const layout = useLayout();

  // Show ellipsis if we have more than 3 nodes (first + last two)
  const showEllipsis = breadcrumb.length > 3;

  // Get visible entries: first node + last two entries
  const visibleItems = showEllipsis
    ? [breadcrumb[0], ...breadcrumb.slice(-2)]
    : breadcrumb;

  // Get middle entries for ellipsis (everything except first and last two)
  const ellipsisItems = showEllipsis ? breadcrumb.slice(1, -2) : [];

  return (
    <Breadcrumb className="flex-grow">
      <BreadcrumbList>
        {visibleItems.map((item, index) => {
          if (!item) {
            return null;
          }

          const isFirst = index === 0;

          return (
            <Fragment key={item.id}>
              {!isFirst && <BreadcrumbSeparator />}
              <BreadcrumbItem
                className="cursor-pointer hover:text-foreground"
                onClick={() => {
                  layout.openLeft(item.id);
                }}
              >
                <ContainerBreadcrumbItem node={item} />
              </BreadcrumbItem>
              {showEllipsis && isFirst && (
                <Fragment>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-1">
                        <BreadcrumbEllipsis className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {ellipsisItems.map((ellipsisItem) => {
                          return (
                            <DropdownMenuItem
                              key={ellipsisItem.id}
                              onClick={() => {
                                layout.openLeft(ellipsisItem.id);
                              }}
                            >
                              <BreadcrumbItem className="cursor-pointer hover:text-foreground">
                                <ContainerBreadcrumbItem node={ellipsisItem} />
                              </BreadcrumbItem>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </Fragment>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
