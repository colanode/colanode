import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { useState, useRef } from 'react';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@colanode/ui/components/ui/tooltip';
import { defaultClasses } from '@colanode/ui/editor/classes';

export const TableNodeView = ({ editor, getPos }: NodeViewProps) => {
  const [isSideHovered, setIsSideHovered] = useState(false);
  const [isBottomHovered, setIsBottomHovered] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const focusTable = () => {
    if (!getPos || typeof getPos !== 'function') {
      return false;
    }

    const pos = getPos();
    if (pos === undefined) {
      return false;
    }

    try {
      const resolvedPos = editor.state.doc.resolve(pos + 1);
      const table = resolvedPos.node(1);

      if (table && table.type.name === 'table') {
        let cellPos = pos + 1;
        table.descendants((node, nodePos) => {
          if (
            node.type.name === 'tableCell' ||
            node.type.name === 'tableHeader'
          ) {
            cellPos = pos + 1 + nodePos + 1;
            return false;
          }
          return true;
        });

        editor.chain().focus().setTextSelection(cellPos).run();
        return true;
      }
    } catch (error) {
      console.warn('Failed to focus table:', error);
    }

    return false;
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    handleMouseMove(event);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Define edge threshold (how close to the edge to trigger hover)
    const edgeThreshold = 50; // pixels

    // Check if mouse is close to right edge or bottom edge
    const isNearRightEdge = x >= rect.width - edgeThreshold;
    const isNearBottomEdge = y >= rect.height - edgeThreshold;

    setIsSideHovered(isNearRightEdge);
    setIsBottomHovered(isNearBottomEdge);
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget;
    const currentTarget = event.currentTarget;

    // Check if both targets are actually Node instances
    if (
      !relatedTarget ||
      !currentTarget ||
      !(relatedTarget instanceof Node) ||
      !(currentTarget instanceof Node)
    ) {
      setIsSideHovered(false);
      setIsBottomHovered(false);
      return;
    }

    if (relatedTarget && currentTarget?.contains(relatedTarget)) {
      return;
    }

    if (
      wrapperRef.current &&
      relatedTarget &&
      wrapperRef.current.contains(relatedTarget)
    ) {
      return;
    }

    setIsSideHovered(false);
    setIsBottomHovered(false);
  };

  return (
    <NodeViewWrapper
      ref={wrapperRef}
      className="pr-4 pb-4 pt-4 w-fit"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative">
        <NodeViewContent<'table'> as="table" className={defaultClasses.table} />
        {isSideHovered && (
          <div className="absolute -right-6 top-0 h-full flex items-center">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <button
                  className="w-4 h-full hover:bg-gray-50 cursor-pointer flex items-center justify-center rounded-sm transition-colors text-muted-foreground text-xs"
                  onClick={() => {
                    if (focusTable()) {
                      editor.chain().addColumnAfter().run();
                    } else {
                      editor.chain().focus().addColumnAfter().run();
                    }
                  }}
                >
                  +
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Add column</TooltipContent>
            </Tooltip>
          </div>
        )}

        {isBottomHovered && (
          <div className="absolute -bottom-6 left-0 w-full flex justify-center">
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <button
                  className="h-4 w-full hover:bg-gray-50 cursor-pointer flex items-center justify-center rounded-sm transition-colors text-muted-foreground text-xs"
                  onClick={() => {
                    if (focusTable()) {
                      editor.chain().addRowAfter().run();
                    } else {
                      editor.chain().focus().addRowAfter().run();
                    }
                  }}
                >
                  +
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Add row</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};
