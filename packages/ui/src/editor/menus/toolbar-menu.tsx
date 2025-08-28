import { Editor, isNodeSelection, useEditorState } from '@tiptap/react';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus';
import { Bold, Code, Italic, Strikethrough, Underline } from 'lucide-react';
import { useState } from 'react';

import { ColorButton } from '@colanode/ui/editor/menus/color-button';
import { HighlightButton } from '@colanode/ui/editor/menus/highlight-button';
import { LinkButton } from '@colanode/ui/editor/menus/link-button';
import { MarkButton } from '@colanode/ui/editor/menus/mark-button';

interface ToolbarMenuProps extends Omit<BubbleMenuProps, 'children'> {
  editor: Editor;
}

export const ToolbarMenu = (props: ToolbarMenuProps) => {
  const [isColorButtonOpen, setIsColorButtonOpen] = useState(false);
  const [isLinkButtonOpen, setIsLinkButtonOpen] = useState(false);
  const [isHighlightButtonOpen, setIsHighlightButtonOpen] = useState(false);

  const state = useEditorState({
    editor: props.editor,
    selector: ({ editor }) => {
      if (!editor) {
        return null;
      }

      return {
        isEditable: editor.isEditable,
        isBoldActive: editor.isActive('bold'),
        isItalicActive: editor.isActive('italic'),
        isUnderlineActive: editor.isActive('underline'),
        isStrikeActive: editor.isActive('strike'),
        isCodeActive: editor.isActive('code'),
      };
    },
  });

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
    options: {
      strategy: 'absolute',
      placement: 'top',
      offset: 8,
      onHide: () => {
        setIsColorButtonOpen(false);
        setIsLinkButtonOpen(false);
        setIsHighlightButtonOpen(false);
      },
    },
  };

  if (props.editor == null) {
    return null;
  }

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      className="flex flex-row items-center gap-1 rounded border border-border bg-muted p-0.5 shadow-xl transition-transform duration-150 ease-out"
    >
      <LinkButton
        editor={props.editor}
        isOpen={isLinkButtonOpen}
        setIsOpen={(isOpen) => {
          setIsColorButtonOpen(false);
          setIsHighlightButtonOpen(false);
          setIsLinkButtonOpen(isOpen);
        }}
      />
      <MarkButton
        isActive={state?.isBoldActive ?? false}
        onClick={() => props.editor?.chain().focus().toggleBold().run()}
        icon={Bold}
      />
      <MarkButton
        isActive={state?.isItalicActive ?? false}
        onClick={() => props.editor?.chain().focus().toggleItalic().run()}
        icon={Italic}
      />
      <MarkButton
        isActive={state?.isUnderlineActive ?? false}
        onClick={() => props.editor?.chain().focus().toggleUnderline().run()}
        icon={Underline}
      />
      <MarkButton
        isActive={state?.isStrikeActive ?? false}
        onClick={() => props.editor?.chain().focus().toggleStrike().run()}
        icon={Strikethrough}
      />
      <MarkButton
        isActive={state?.isCodeActive ?? false}
        onClick={() => props.editor?.chain().focus().toggleCode().run()}
        icon={Code}
      />
      <ColorButton
        editor={props.editor}
        isOpen={isColorButtonOpen}
        setIsOpen={(isOpen) => {
          setIsColorButtonOpen(isOpen);
          setIsLinkButtonOpen(false);
          setIsHighlightButtonOpen(false);
        }}
      />
      <HighlightButton
        editor={props.editor}
        isOpen={isHighlightButtonOpen}
        setIsOpen={(isOpen) => {
          setIsHighlightButtonOpen(isOpen);
          setIsColorButtonOpen(false);
          setIsLinkButtonOpen(false);
        }}
      />
    </BubbleMenu>
  );
};
