import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  FloatingPortal,
} from '@floating-ui/react';
import type { Range } from '@tiptap/core';
import { Editor, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
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

import { EditorContext, User } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import { MentionNodeView } from '@colanode/ui/editor/views';
import { updateScrollView } from '@colanode/ui/lib/utils';

interface MentionOptions {
  context: EditorContext | null;
}

const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];

const CommandList = ({
  items,
  command,
  range,
  props,
}: {
  items: User[];
  command: (item: User, range: Range) => void;
  range: Range;
  props: SuggestionProps<User>;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    middleware: [offset(6), flip(), shift()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });

  useLayoutEffect(() => {
    if (props.clientRect) {
      refs.setPositionReference({
        getBoundingClientRect: () => props.clientRect?.() || new DOMRect(),
      });
    }
  }, [props.clientRect, refs]);

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
          {items.map((item: User, index: number) => (
            <button
              type="button"
              className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100 ${
                index === selectedIndex ? 'bg-stone-100 text-stone-900' : ''
              }`}
              key={item.id}
              onClick={() => selectItem(index)}
            >
              <Avatar
                id={item.id}
                name={item.name}
                avatar={item.avatar}
                className="size-8"
              />
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-stone-500">{item.email}</p>
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
  let editor: Editor | null = null;

  return {
    onStart: (props: SuggestionProps<User>) => {
      editor = props.editor;
      props.editor.storage.mention.isOpen = true;

      component = new ReactRenderer(CommandList, {
        props: {
          ...props,
          props,
        },
        editor: props.editor,
      });
    },
    onUpdate: (props: SuggestionProps<User>) => {
      props.editor.storage.mention.isOpen = true;
      component?.updateProps({
        ...props,
        props,
      });
    },
    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (editor) {
        editor.storage.mention.isOpen = true;
      }

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
      if (editor) {
        editor.storage.mention.isOpen = false;
      }
    },
  };
};

export const MentionExtension = Node.create<MentionOptions>({
  name: 'mention',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,
  addAttributes() {
    return {
      id: {
        default: null,
      },
      target: {
        default: null,
      },
    };
  },
  addOptions() {
    return {
      context: {} as EditorContext,
    };
  },
  addStorage() {
    return {
      isOpen: false,
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MentionNodeView, {
      as: 'mention',
      className: 'inline-flex',
    });
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '@',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: User;
        }) => {
          // increase range.to by one when the next node is of type "text"
          // and starts with a space character
          const nodeAfter = editor.view.state.selection.$to.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(' ');

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: this.name,
                attrs: {
                  id: generateId(IdType.Mention),
                  target: props.id,
                },
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();

          window.getSelection()?.collapseToEnd();
        },
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const type = state.schema.nodes[this.name];
          if (!type) return false;
          return !!$from.parent.type.contentMatch.matchType(type);
        },
        items: async ({ query }: { query: string }) => {
          return new Promise<User[]>((resolve) => {
            if (!this.options.context) {
              resolve([] as User[]);
              return;
            }

            const { accountId, workspaceId, userId } = this.options.context;
            window.colanode
              .executeQuery({
                type: 'user.search',
                accountId,
                workspaceId,
                searchQuery: query,
                exclude: [userId],
              })
              .then((users) => {
                resolve(users);
              });
          });
        },
        render: renderItems,
      }),
    ];
  },
});
