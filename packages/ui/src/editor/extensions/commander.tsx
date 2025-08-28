import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
} from '@floating-ui/react';
import type { Range } from '@tiptap/core';
import { Editor, Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import {
  Suggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from '@tiptap/suggestion';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { EditorCommand, EditorContext } from '@colanode/client/types';
import {
  ScrollArea,
  ScrollViewport,
  ScrollBar,
} from '@colanode/ui/components/ui/scroll-area';
import { updateScrollView } from '@colanode/ui/lib/utils';

interface CommanderOptions {
  commands: EditorCommand[];
  context: EditorContext | null;
}

const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];

const filterCommands = ({
  query,
  commands,
}: {
  query: string;
  commands: EditorCommand[];
}) =>
  commands.filter((command) => {
    if (query.length > 0) {
      const search = query.toLowerCase();
      return (
        command.name.toLowerCase().includes(search) ||
        command.description.toLowerCase().includes(search) ||
        (command.keywords &&
          command.keywords.some((keyword: string) => keyword.includes(search)))
      );
    }
    return true;
  });

const CommandList = ({
  items,
  command,
  range,
  props,
}: {
  items: EditorCommand[];
  command: (item: EditorCommand, range: Range) => void;
  range: Range;
  props: SuggestionProps<EditorCommand>;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    middleware: [offset(6), flip(), shift()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
    elements: {
      reference: {
        getBoundingClientRect: () => props.clientRect?.() || new DOMRect(),
        contextElement: document.body,
      } as unknown as Element,
    },
  });

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item, range);
      }
    },
    [command, items, range]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length);
          return true;
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length);
          return true;
        }
        if (e.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      }

      return false;
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [items, selectedIndex, setSelectedIndex, selectItem]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const scrollContainer = useRef<HTMLDivElement>(null);
  const listContainer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const item = listContainer?.current?.children[selectedIndex] as HTMLElement;

    if (item && scrollContainer?.current) {
      updateScrollView(scrollContainer.current, item);
    }
  }, [selectedIndex]);

  return items.length > 0 ? (
    <FloatingPortal>
      <div ref={refs.setFloating} style={floatingStyles}>
        <div
          id="slash-command"
          className="z-50 min-w-[8rem] w-80 rounded-md border bg-popover text-popover-foreground p-1 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 overflow-hidden"
        >
          <ScrollArea className="h-80">
            <ScrollViewport ref={scrollContainer}>
              <div ref={listContainer}>
                {items.map((item: EditorCommand, index: number) => (
                  <button
                    type="button"
                    className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : ''
                    }`}
                    key={item.key}
                    onClick={() => selectItem(index)}
                  >
                    <div className="flex size-10 min-w-10 items-center justify-center rounded-md border bg-background">
                      <item.icon className="size-4 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollViewport>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    </FloatingPortal>
  ) : null;
};

const renderItems = () => {
  let component: ReactRenderer | null = null;

  return {
    onStart: (props: SuggestionProps<EditorCommand>) => {
      component = new ReactRenderer(CommandList, {
        props: {
          ...props,
          props,
        },
        editor: props.editor,
      });
    },
    onUpdate: (props: SuggestionProps<EditorCommand>) => {
      component?.updateProps({
        ...props,
        props,
      });
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === 'Escape') {
        return true;
      }

      if (navigationKeys.includes(props.event.key)) {
        return true;
      }

      // @ts-expect-error Component ref type is complex
      return component?.ref?.onKeyDown(props);
    },
    onExit: () => {
      component?.destroy();
    },
  };
};

export const CommanderExtension = Extension.create<CommanderOptions>({
  name: 'commander',
  addOptions() {
    return {
      commands: [],
      context: {} as EditorContext,
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        command: async ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: EditorCommand;
        }) => {
          const result = props.handler({
            editor,
            range,
            context: this.options.context,
          });

          if (result instanceof Promise) {
            await result;
          }
        },
        items: ({ query }: { query: string }) =>
          filterCommands({ query, commands: this.options.commands }),
        render: renderItems,
      }),
    ];
  },
});
