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

  const commandListContainer = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = commandListContainer?.current;

    const item = container?.children[selectedIndex] as HTMLElement;

    if (item && container) updateScrollView(container, item);
  }, [selectedIndex]);

  return items.length > 0 ? (
    <FloatingPortal>
      <div ref={refs.setFloating} style={floatingStyles}>
        <div
          id="slash-command"
          ref={commandListContainer}
          className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all"
        >
          {items.map((item: EditorCommand, index: number) => (
            <button
              type="button"
              className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100 ${
                index === selectedIndex ? 'bg-stone-100 text-stone-900' : ''
              }`}
              key={item.key}
              onClick={() => selectItem(index)}
            >
              <div className="flex size-10 min-w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-stone-500">{item.description}</p>
              </div>
            </button>
          ))}
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
