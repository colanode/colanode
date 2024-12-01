import '@/renderer/styles/highlight.css';

import { type NodeViewProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Check, ChevronDown, Clipboard } from 'lucide-react';
import React from 'react';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/renderer/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { defaultClasses } from '@/renderer/editor/classes';
import { languages } from '@/shared/lib/lowlight';
import { cn } from '@/shared/lib/utils';

export const CodeBlockNodeView = ({
  node,
  updateAttributes,
}: NodeViewProps) => {
  const language = node.attrs?.language ?? 'plaintext';
  const languageItem = languages.find((item) => item.code === language);
  const code = node.textContent ?? '';

  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  return (
    <NodeViewWrapper
      data-id={node.attrs.id}
      as="pre"
      className={defaultClasses.codeBlock}
    >
      <div className={defaultClasses.codeBlockHeader}>
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger className="flex cursor-pointer flex-row items-center gap-1 outline-none hover:text-foreground">
            <p>{languageItem?.name ?? ' '}</p>
            <ChevronDown className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="p-2">
            <Command className="max-h-80">
              <CommandInput placeholder="Search language..." />
              <CommandEmpty>No languages found.</CommandEmpty>
              <CommandList>
                <CommandGroup className="overflow-auto">
                  {languages.map((languageItem) => (
                    <CommandItem
                      key={languageItem.code}
                      value={`${languageItem.code} - ${languageItem.name}`}
                      onSelect={() => {
                        updateAttributes({
                          language: languageItem.code,
                        });
                        setOpen(false);
                      }}
                    >
                      {languageItem.name}
                      <Check
                        className={cn(
                          'ml-auto mr-2 size-4',
                          language === languageItem.code
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div
          className="flex cursor-pointer flex-row items-center gap-1"
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
            });
          }}
        >
          <Clipboard className="size-4" />
          <p>{copied ? 'Copied' : 'Copy code'}</p>
        </div>
      </div>
      <code>
        <NodeViewContent />
      </code>
    </NodeViewWrapper>
  );
};
