import { type NodeViewProps } from '@tiptap/core';
import {
  Trash,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  AlignJustify,
  Check,
} from 'lucide-react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@colanode/ui/components/ui/context-menu';
import { editorColors } from '@colanode/ui/lib/editor';
import { cn } from '@colanode/ui/lib/utils';

interface TableCellContextMenuProps extends NodeViewProps {
  children: React.ReactNode;
}

export const TableCellContextMenu = ({
  editor,
  node,
  updateAttributes,
  children,
}: TableCellContextMenuProps) => {
  const textAlign = node.attrs.align ?? 'left';
  const backgroundColor = node.attrs.backgroundColor ?? 'default';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuLabel>Cell Actions</ContextMenuLabel>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex gap-2">
            <AlignJustify className="size-4 text-muted-foreground" />
            Alignment
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuLabel>Alignment</ContextMenuLabel>
            <ContextMenuItem
              onSelect={() => updateAttributes({ align: 'left' })}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlignLeft className="size-4" />
                Left
              </div>
              {textAlign === 'left' && <Check className="size-4" />}
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => updateAttributes({ align: 'center' })}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlignCenter className="size-4" />
                Center
              </div>
              {textAlign === 'center' && <Check className="size-4" />}
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => updateAttributes({ align: 'right' })}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlignRight className="size-4" />
                Right
              </div>
              {textAlign === 'right' && <Check className="size-4" />}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex gap-2">
            <Highlighter className="size-4 text-muted-foreground" />
            Background Color
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuLabel>Background Color</ContextMenuLabel>
            {editorColors.map((color) => (
              <ContextMenuItem
                key={color.color}
                onSelect={() =>
                  updateAttributes({ backgroundColor: color.color })
                }
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border border-border',
                      color.bgClass
                    )}
                  />
                  {color.name}
                </div>
                {backgroundColor === color.color && (
                  <Check className="size-4" />
                )}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuLabel>Column Actions</ContextMenuLabel>
        <ContextMenuItem
          onSelect={() => {
            editor.chain().addColumnBefore().focus().run();
          }}
        >
          <ArrowLeft className="size-4" />
          Insert column left
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            editor.chain().addColumnAfter().focus().run();
          }}
        >
          <ArrowRight className="size-4" />
          Insert column right
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            editor.chain().focus().deleteColumn().run();
          }}
        >
          <Trash className="size-4" />
          Delete column
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuLabel>Row Actions</ContextMenuLabel>
        <ContextMenuItem
          onSelect={() => {
            editor.chain().addRowBefore().focus().run();
          }}
        >
          <ArrowUp className="size-4" />
          Insert row above
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            editor.chain().addRowAfter().focus().run();
          }}
        >
          <ArrowDown className="size-4" />
          Insert row below
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            editor.chain().focus().deleteRow().run();
          }}
        >
          <Trash className="size-4" />
          Delete row
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
