import { Editor } from '@tiptap/core';
import { Baseline } from 'lucide-react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { cn } from '@/shared/lib/utils';

interface ColorItem {
  color: string;
  textClass: string;
  bgClass: string;
  name: string;
}

const colors: ColorItem[] = [
  {
    name: 'Default',
    color: 'default',
    textClass: 'text-black-600',
    bgClass: '',
  },
  {
    name: 'Gray',
    color: 'gray',
    textClass: 'text-gray-600',
    bgClass: 'bg-gray-100',
  },
  {
    name: 'Orange',
    color: 'orange',
    textClass: 'text-orange-600',
    bgClass: 'bg-orange-200',
  },
  {
    name: 'Yellow',
    color: 'yellow',
    textClass: 'text-yellow-600',
    bgClass: 'bg-yello-200',
  },
  {
    name: 'Green',
    color: 'green',
    textClass: 'text-green-600',
    bgClass: 'bg-green-200',
  },
  {
    name: 'Blue',
    color: 'blue',
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-200',
  },
  {
    name: 'Purple',
    color: 'purple',
    textClass: 'text-purple-600',
    bgClass: 'bg-purple-200',
  },
  {
    name: 'Pink',
    color: 'pink',
    textClass: 'text-pink-600',
    bgClass: 'bg-pink-200',
  },
  {
    name: 'Red',
    color: 'red',
    textClass: 'text-red-600',
    bgClass: 'bg-red-200',
  },
];

export const ColorButton = ({
  editor,
  isOpen,
  setIsOpen,
}: {
  editor: Editor;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const activeColor = colors.find((color) =>
    editor.isActive('color', { color: color.color })
  );

  const activeHighlight = colors.find((color) =>
    editor.isActive('highlight', { highlight: color.color })
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger>
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md hover:cursor-pointer hover:bg-gray-100',
            activeHighlight?.bgClass ?? 'bg-white'
          )}
        >
          <Baseline className={cn('size-4', activeColor?.textClass ?? '')} />
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="z-50 max-h-96 min-w-0 overflow-y-auto"
      >
        <p className="text-sm text-muted-foreground">Color</p>
        <div className="mt-1 flex flex-col gap-1">
          {colors.map((color) => (
            <button
              type="button"
              key={`text-color-${color.color}`}
              onClick={() =>
                color.color === 'default'
                  ? editor.commands.unsetColor()
                  : editor.chain().focus().setColor(color.color).run()
              }
            >
              <div className="flex cursor-pointer flex-row items-center gap-2 p-1 pl-0 hover:bg-gray-100">
                <div className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded bg-gray-50 shadow">
                  <span className={cn('font-medium', color.textClass)}>A</span>
                </div>
                <span className="text-sm">{color.name}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Highlight</p>
        <div className="mt-1 flex flex-col gap-1">
          {colors.map((color) => (
            <button
              type="button"
              key={`text-color-${color.color}`}
              onClick={() =>
                color.color === 'default'
                  ? editor.commands.unsetHighlight()
                  : editor.commands.setHighlight(color.color)
              }
            >
              <div className="flex cursor-pointer flex-row items-center gap-2 p-1 pl-0 hover:bg-gray-100">
                <div
                  className={cn(
                    'relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded shadow',
                    color.bgClass
                  )}
                >
                  <span className="font-medium">A</span>
                </div>
                <span className="text-sm">{color.name}</span>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
