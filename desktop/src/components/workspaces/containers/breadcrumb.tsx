import React from 'react';
import { LocalNode } from '@/types/nodes';
import {
  Breadcrumb as BreadcrumbWrapper,
  BreadcrumbEllipsis,
  BreadcrumbItem as BreadcrumbItemWrapper,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NodeTypes } from '@/lib/constants';
import { useWorkspace } from '@/contexts/workspace';
import { BreadcrumbItem } from '@/components/workspaces/containers/breadcrumb-item';
import { BreadcrumbItemEditor } from '@/components/workspaces/containers/breadcrumb-item-editor';
import { useBreadcrumbQuery } from '@/queries/use-breadcrumb-query';

interface BreadcrumbProps {
  node: LocalNode;
}

export const Breadcrumb = ({ node }: BreadcrumbProps) => {
  const workspace = useWorkspace();
  const { data, isPending } = useBreadcrumbQuery(node.id);

  if (isPending) {
    return null;
  }

  const showEllipsis = data.length > 2;
  const visibleNodes = showEllipsis ? [data[0], data[data.length - 1]] : data;
  const ellipsisNodes = showEllipsis ? data.slice(1, -1) : [];

  const isClickable = (type: string) => type !== NodeTypes.Space;

  return (
    <BreadcrumbWrapper className="mx-1 flex h-12 justify-between p-2 text-foreground/80">
      <BreadcrumbList>
        {visibleNodes.map((breadcrumbNode, index) => (
          <React.Fragment key={breadcrumbNode.id}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItemWrapper
              onClick={() => {
                if (isClickable(breadcrumbNode.type)) {
                  workspace.navigateToNode(breadcrumbNode.id);
                }
              }}
            >
              {breadcrumbNode.id === node.id ? (
                <Popover>
                  <PopoverTrigger>
                    <BreadcrumbItem node={breadcrumbNode} />
                  </PopoverTrigger>
                  <PopoverContent>
                    <BreadcrumbItemEditor node={breadcrumbNode} />
                  </PopoverContent>
                </Popover>
              ) : (
                <BreadcrumbItem
                  node={breadcrumbNode}
                  className={
                    isClickable(breadcrumbNode.type)
                      ? 'hover:cursor-pointer hover:text-foreground'
                      : ''
                  }
                />
              )}
            </BreadcrumbItemWrapper>
            {showEllipsis && index === 0 && (
              <React.Fragment>
                <BreadcrumbSeparator />
                <BreadcrumbItemWrapper>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <BreadcrumbEllipsis className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {ellipsisNodes.map((ellipsisNode) => (
                        <DropdownMenuItem
                          key={ellipsisNode.id}
                          onClick={() => {
                            if (isClickable(ellipsisNode.type)) {
                              workspace.navigateToNode(ellipsisNode.id);
                            }
                          }}
                        >
                          <BreadcrumbItem
                            node={ellipsisNode}
                            className={
                              isClickable(ellipsisNode.type)
                                ? 'hover:cursor-pointer hover:text-foreground'
                                : ''
                            }
                          />
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItemWrapper>
              </React.Fragment>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </BreadcrumbWrapper>
  );
};