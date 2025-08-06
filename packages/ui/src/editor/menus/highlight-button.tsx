import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { Highlighter } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { editorColors } from '@colanode/ui/lib/editor';
import { cn } from '@colanode/ui/lib/utils';

export const HighlightButton = ({
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
        activeHighlight: editorColors.find((editorColor) =>
          editor.isActive('highlight', { highlight: editorColor.color })
        ),
      };
    },
  });

  const activeHighlight = state?.activeHighlight ?? editorColors[0]!;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger>
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-md cursor-pointer',
            activeHighlight.bgClass,
            activeHighlight.bgHoverClass
          )}
        >
          <Highlighter className="size-4" />
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="overflow-x-hidden overflow-y-auto rounded-md p-1"
      >
        <div className="px-2 py-1.5 text-sm font-medium">Highlight</div>
        <div>
          {editorColors.map((editorColor) => (
            <button
              key={`highlight-color-${editorColor.color}`}
              onClick={() => {
                if (editorColor.color === 'default') {
                  editor.commands.unsetHighlight();
                } else {
                  editor.commands.setHighlight(editorColor.color);
                }
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer"
            >
              <div
                className={cn(
                  'relative inline-flex size-6 items-center justify-center overflow-hidden rounded bg-gray-50 shadow',
                  editorColor.bgClass
                )}
              >
                <span className="font-medium">A</span>
              </div>
              <span>{editorColor.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
