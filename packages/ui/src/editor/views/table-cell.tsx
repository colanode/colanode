import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import {
  Trash,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  EllipsisVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { useEditorNodeActive } from '@colanode/ui/hooks/use-editor-node-active';
import { cn } from '@colanode/ui/lib/utils';

export const TableCellNodeView = ({ editor, node, getPos }: NodeViewProps) => {
  const isActive = useEditorNodeActive({ editor, node, getPos });

  return (
    <NodeViewWrapper
      className={cn(
        'p-1 px-2',
        'relative',
        isActive && 'outline outline-gray-400'
      )}
    >
      {isActive && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute top-1/2 -right-2 transform -translate-y-1/2 bg-white hover:bg-gray-100 py-1 cursor-pointer border border-gray-200 rounded z-10">
              <EllipsisVertical className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-52">
            <DropdownMenuLabel>Cell Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                console.log('Align left');
              }}
            >
              <AlignLeft className="size-4" />
              Align left
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Align center');
              }}
            >
              <AlignCenter className="size-4" />
              Align center
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log('Align right');
              }}
            >
              <AlignRight className="size-4" />
              Align right
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Column Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                editor.chain().addColumnBefore().focus().run();
              }}
            >
              <ArrowLeft className="size-4" />
              Insert column left
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.chain().addColumnAfter().focus().run();
              }}
            >
              <ArrowRight className="size-4" />
              Insert column right
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.chain().focus().deleteColumn().run();
              }}
            >
              <Trash className="size-4" />
              Delete column
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Row Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                editor.chain().addRowBefore().focus().run();
              }}
            >
              <ArrowUp className="size-4" />
              Insert row above
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.chain().addRowAfter().focus().run();
              }}
            >
              <ArrowDown className="size-4" />
              Insert row below
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                editor.chain().focus().deleteRow().run();
              }}
            >
              <Trash className="size-4" />
              Delete row
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <NodeViewContent className="table-header" />
    </NodeViewWrapper>
  );
};
