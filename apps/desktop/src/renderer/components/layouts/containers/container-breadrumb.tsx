import React from 'react';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/renderer/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { useLayout } from '@/renderer/contexts/layout';
import { ContainerBreadcrumbItem } from '@/renderer/components/layouts/containers/container-breadcrumb-item';

interface ContainerBreadcrumbProps {
  breadcrumb: string[];
}

export const ContainerBreadcrumb = ({
  breadcrumb,
}: ContainerBreadcrumbProps) => {
  const layout = useLayout();

  // Show ellipsis if we have more than 3 nodes (first + last two)
  const showEllipsis = breadcrumb.length > 3;

  // Get visible entries: first entry + last two entries
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
            <React.Fragment key={item}>
              {!isFirst && <BreadcrumbSeparator />}
              <BreadcrumbItem
                className="hover:cursor-pointer hover:text-foreground"
                onClick={() => {
                  layout.openLeft(item);
                }}
              >
                <ContainerBreadcrumbItem id={item} />
              </BreadcrumbItem>
              {showEllipsis && isFirst && (
                <React.Fragment>
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
                              key={ellipsisItem}
                              onClick={() => {
                                layout.openLeft(ellipsisItem);
                              }}
                            >
                              <BreadcrumbItem className="hover:cursor-pointer hover:text-foreground">
                                <ContainerBreadcrumbItem id={ellipsisItem} />
                              </BreadcrumbItem>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                </React.Fragment>
              )}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
