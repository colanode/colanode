import { Node, NodeTypes } from '@colanode/core';
import React from 'react';

import { NodeBreadcrumbItem } from '@/renderer/components/layouts/node-breadcrumb-item';
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
import { useWorkspace } from '@/renderer/contexts/workspace';

interface NodeBreadcrumbProps {
  nodes: Node[];
}

const isClickable = (type: string) =>
  type !== NodeTypes.Space && type !== NodeTypes.Message;

export const NodeBreadcrumb = ({ nodes }: NodeBreadcrumbProps) => {
  const workspace = useWorkspace();

  // Show ellipsis if we have more than 3 nodes (first + last two)
  const showEllipsis = nodes.length > 3;

  // Get visible nodes: first node + last two nodes
  const visibleNodes = showEllipsis ? [nodes[0], ...nodes.slice(-2)] : nodes;

  // Get middle nodes for ellipsis (everything except first and last two)
  const ellipsisNodes = showEllipsis ? nodes.slice(1, -2) : [];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {visibleNodes.map((node, index) => {
          if (!node) {
            return null;
          }

          const isFirst = index === 0;
          const isClickableNode = isClickable(node.type);

          return (
            <React.Fragment key={node.id}>
              {!isFirst && <BreadcrumbSeparator />}
              <BreadcrumbItem
                className={
                  isClickableNode
                    ? 'hover:cursor-pointer hover:text-foreground'
                    : ''
                }
                onClick={() => {
                  if (isClickableNode) {
                    workspace.openInMain(node.id);
                  }
                }}
              >
                <NodeBreadcrumbItem node={node} />
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
                        {ellipsisNodes.map((ellipsisNode) => {
                          const isClickableEllipsisNode = isClickable(
                            ellipsisNode.type
                          );
                          return (
                            <DropdownMenuItem
                              key={ellipsisNode.id}
                              disabled={!isClickableEllipsisNode}
                              onClick={() => {
                                if (isClickableEllipsisNode) {
                                  workspace.openInMain(ellipsisNode.id);
                                }
                              }}
                            >
                              <BreadcrumbItem
                                className={
                                  isClickableEllipsisNode
                                    ? 'hover:cursor-pointer hover:text-foreground'
                                    : ''
                                }
                              >
                                <NodeBreadcrumbItem node={ellipsisNode} />
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
