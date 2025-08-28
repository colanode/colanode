import { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { Check, Link, Trash2 } from 'lucide-react';

import { isValidUrl } from '@colanode/core';
import { Button } from '@colanode/ui/components/ui/button';
import { Input } from '@colanode/ui/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { cn } from '@colanode/ui/lib/utils';

const getUrlFromString = (str: string): string | null => {
  if (isValidUrl(str)) return str;
  try {
    if (str.includes('.') && !str.includes(' ')) {
      return new URL(`https://${str}`).toString();
    }
  } catch {
    return null;
  }

  return null;
};

interface LinkButtonProps {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const LinkButton = ({ editor, isOpen, setIsOpen }: LinkButtonProps) => {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) {
        return null;
      }

      return {
        isEditable: editor.isEditable,
        isActive: editor.isActive('link'),
        attributes: editor.getAttributes('link'),
      };
    },
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger>
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md cursor-pointer hover:bg-input',
            state?.isActive && 'bg-input'
          )}
        >
          <Link className="size-4" />
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="z-[9999] min-w-0 p-1">
        <form
          className="flex flex-row items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget[0] as HTMLInputElement;
            const url = getUrlFromString(input.value);
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }

            setIsOpen(false);
          }}
        >
          <Input
            placeholder="Write or paste link"
            className="border-0"
            defaultValue={state?.attributes.href || ''}
          />
          {state?.attributes.href ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus().unsetLink().run();
                setIsOpen(false);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : (
            <Button type="submit" variant="outline" size="icon">
              <Check className="size-4" />
            </Button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
};
