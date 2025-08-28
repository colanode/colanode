import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { Baseline } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { editorColors } from '@colanode/ui/lib/editor';
import { cn } from '@colanode/ui/lib/utils';

export const ColorButton = ({
  editor,
  isOpen,
  setIsOpen,
}: {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return null;
      }

      return {
        isEditable: editor.isEditable,
        activeColor: editorColors.find((editorColor) =>
          editor.isActive('color', { color: editorColor.color })
        ),
      };
    },
  });

  const activeColor = state?.activeColor ?? editorColors[0]!;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger>
        <span className="flex size-8 items-center justify-center rounded-md cursor-pointer hover:bg-input">
          <Baseline className={cn('size-4', activeColor.textClass)} />
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="overflow-x-hidden overflow-y-auto rounded-md p-1"
      >
        <div className="px-2 py-1.5 text-sm font-medium">Color</div>
        <div>
          {editorColors.map((color) => (
            <button
              key={`text-color-${color.color}`}
              onClick={() => {
                if (color.color === 'default') {
                  editor.commands.unsetColor();
                } else {
                  editor.chain().focus().setColor(color.color).run();
                }
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-input cursor-pointer"
            >
              <div className="relative inline-flex size-6 items-center justify-center overflow-hidden rounded bg-muted shadow">
                <span className={cn('font-medium', color.textClass)}>A</span>
              </div>
              <span>{color.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
