import {
  BubbleMenu,
  type BubbleMenuProps,
  Editor,
  isNodeSelection,
} from '@tiptap/react';
import { Bold, Code, Italic, Strikethrough, Underline } from 'lucide-react';
import { useState } from 'react';

import { ColorButton } from '@colanode/ui/editor/menus/color-button';
import { LinkButton } from '@colanode/ui/editor/menus/link-button';
import { MarkButton } from '@colanode/ui/editor/menus/mark-button';

interface ToolbarMenuProps extends Omit<BubbleMenuProps, 'children'> {
  editor: Editor;
}

export const ToolbarMenu = (props: ToolbarMenuProps) => {
  const [isColorButtonOpen, setIsColorButtonOpen] = useState(false);
  const [isLinkButtonOpen, setIsLinkButtonOpen] = useState(false);

  const bubbleMenuProps: ToolbarMenuProps = {
    ...props,
    shouldShow: ({ state, editor }) => {
      const { selection } = state;
      const { empty } = selection;

      if (empty) {
        return false;
      }

      if (isNodeSelection(selection)) {
        return false;
      }

      if (
        editor.isActive('page') ||
        editor.isActive('database') ||
        editor.isActive('folder') ||
        editor.isActive('file') ||
        editor.isActive('tempFile')
      ) {
        return false;
      }

      return true;
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
      <MarkButton
        isActive={props.editor?.isActive('bold') === true}
        onClick={() => props.editor?.chain().focus().toggleBold().run()}
        icon={Bold}
      />
      <MarkButton
        isActive={props.editor?.isActive('italic') === true}
        onClick={() => props.editor?.chain().focus().toggleItalic().run()}
        icon={Italic}
      />
      <MarkButton
        isActive={props.editor?.isActive('underline') === true}
        onClick={() => props.editor?.chain().focus().toggleUnderline().run()}
        icon={Underline}
      />
      <MarkButton
        isActive={props.editor?.isActive('strike') === true}
        onClick={() => props.editor?.chain().focus().toggleStrike().run()}
        icon={Strikethrough}
      />
      <MarkButton
        isActive={props.editor?.isActive('code') === true}
        onClick={() => props.editor?.chain().focus().toggleCode().run()}
        icon={Code}
      />
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
