import {
  BubbleMenu,
  type BubbleMenuProps,
  isNodeSelection,
} from '@tiptap/react';
import { Bold, Code, Italic, Strikethrough, Underline } from 'lucide-react';
import { useState } from 'react';

import { ColorButton } from '@/renderer/editor/menu/color-button';
import { LinkButton } from '@/renderer/editor/menu/link-button';
import { cn } from '@/shared/lib/utils';

type EditorBubbleMenuProps = Omit<BubbleMenuProps, 'children'>;

export const EditorBubbleMenu = (props: EditorBubbleMenuProps) => {
  const [isColorButtonOpen, setIsColorButtonOpen] = useState(false);
  const [isLinkButtonOpen, setIsLinkButtonOpen] = useState(false);

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    shouldShow: ({ state, editor }) => {
      const { selection } = state;
      const { empty } = selection;

      // don't show bubble menu if:
      // - the selected node is an image
      // - the selection is empty
      // - the selection is a node selection (for drag handles)
      return !(editor.isActive('image') || empty || isNodeSelection(selection));
    },
    tippyOptions: {
      moveTransition: 'transform 0.15s ease-out',
      onHidden: () => {
        setIsColorButtonOpen(false);
        setIsLinkButtonOpen(false);
      },
    },
  };

  if (props.editor == null) {
    return null;
  }

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="flex flex-row items-center gap-1 rounded border bg-white p-0.5 shadow-xl"
    >
      <LinkButton
        editor={props.editor}
        isOpen={isLinkButtonOpen}
        setIsOpen={(isOpen) => {
          setIsColorButtonOpen(false);
          setIsLinkButtonOpen(isOpen);
        }}
      />
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100',
          props.editor?.isActive('bold') === true ? 'bg-gray-100' : 'bg-white'
        )}
        onClick={() => props.editor?.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100',
          props.editor?.isActive('italic') === true ? 'bg-gray-100' : 'bg-white'
        )}
        onClick={() => props.editor?.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </button>
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100',
          props.editor?.isActive('underline') === true
            ? 'bg-gray-100'
            : 'bg-white'
        )}
        onClick={() => props.editor?.chain().focus().toggleUnderline().run()}
      >
        <Underline className="size-4" />
      </button>
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100',
          props.editor?.isActive('strike') === true ? 'bg-gray-100' : 'bg-white'
        )}
        onClick={() => props.editor?.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </button>
      <button
        type="button"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100',
          props.editor?.isActive('code') === true ? 'bg-gray-100' : 'bg-white'
        )}
        onClick={() => props.editor?.chain().focus().toggleCode().run()}
      >
        <Code className="size-4" />
      </button>
      <ColorButton
        editor={props.editor}
        isOpen={isColorButtonOpen}
        setIsOpen={(isOpen) => {
          setIsColorButtonOpen(isOpen);
          setIsLinkButtonOpen(false);
        }}
      />
    </BubbleMenu>
  );
};
