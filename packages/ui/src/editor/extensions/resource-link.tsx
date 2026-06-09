import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    FloatingPortal,
    VirtualElement,
} from '@floating-ui/react';
import type { Range } from '@tiptap/core';
import { Editor, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
import {
    Suggestion,
    type SuggestionKeyDownProps,
    type SuggestionProps,
} from '@tiptap/suggestion'; import { PluginKey } from '@tiptap/pm/state'; import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

import { EditorContext, MentionSearchItem, MentionTargetType } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
    ScrollArea,
    ScrollViewport,
    ScrollBar,
} from '@colanode/ui/components/ui/scroll-area';
import { ResourceLinkNodeView } from '@colanode/ui/editor/views/resource-link';
import { updateScrollView } from '@colanode/ui/lib/utils';

declare module '@tiptap/core' {
    interface Storage {
        resourceLink: {
            isOpen: boolean;
        };
    }
}

interface ResourceLinkOptions {
    context: EditorContext | null;
}

const RESOURCE_LINK_ALLOWED_TYPES: MentionTargetType[] = [
    'channel',
    'page',
    'record',
    'database',
    'chat',
    'space',
    'folder',
    'file',
];

const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter'];

const CommandList = ({
    items,
    command,
    range,
    props,
}: {
    items: MentionSearchItem[];
    command: (item: MentionSearchItem, range: Range) => void;
    range: Range;
    props: SuggestionProps<MentionSearchItem>;
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const { refs, floatingStyles, update } = useFloating({
        placement: 'bottom-start',
        middleware: [offset(6), flip(), shift()],
        whileElementsMounted: autoUpdate,
        strategy: 'fixed',
    });

    useLayoutEffect(() => {
        const rect = props.clientRect?.();
        if (!rect) return;

        const virtualEl = {
            getBoundingClientRect: () => rect,
            contextElement: props.editor.view.dom as Element,
        };

        refs.setPositionReference(virtualEl as VirtualElement);
        update();
    }, [props.clientRect, props.editor.view.dom, refs, update]);

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
            <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 60 }}>
                <div
                    id="resource-link-command"
                    className="z-50 min-w-32 w-80 rounded-md border bg-popover text-popover-foreground p-1 shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 overflow-hidden"
                >
                    <ScrollArea className="h-80">
                        <ScrollViewport ref={scrollContainer}>
                            <div ref={listContainer}>
                                {items.map((item: MentionSearchItem, index: number) => (
                                    <button
                                        type="button"
                                        className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left outline-hidden select-none focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground ${index === selectedIndex
                                            ? 'bg-accent text-accent-foreground'
                                            : ''
                                            }`}
                                        key={`${item.type}:${item.id}:${item.name}`}
                                        onClick={() => selectItem(index)}
                                        onPointerDownCapture={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            selectItem(index);
                                        }}
                                    >
                                        <div className="flex size-10 min-w-10 items-center justify-center rounded-md border bg-background">
                                            <Avatar
                                                id={item.id}
                                                name={item.name}
                                                avatar={item.avatar ?? undefined}
                                                className="size-8"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.subtitle ?? item.type}
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
    let editor: Editor | null = null;

    return {
        onStart: (props: SuggestionProps<MentionSearchItem>) => {
            editor = props.editor;
            props.editor.storage.resourceLink.isOpen = true;

            component = new ReactRenderer(CommandList, {
                props: {
                    ...props,
                    props,
                },
                editor: props.editor,
            });
        },
        onUpdate: (props: SuggestionProps<MentionSearchItem>) => {
            props.editor.storage.resourceLink.isOpen = true;
            component?.updateProps({
                ...props,
                props,
            });
        },
        onKeyDown: (props: SuggestionKeyDownProps) => {
            if (editor) {
                editor.storage.resourceLink.isOpen = true;
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
                editor.storage.resourceLink.isOpen = false;
            }
        },
    };
};

export const ResourceLinkExtension = Node.create<ResourceLinkOptions>({
    name: 'resourceLink',
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
            targetType: {
                default: null,
            },
            label: {
                default: null,
            },
        };
    },
    addOptions() {
        return {
            context: null,
        };
    },
    addStorage() {
        return {
            isOpen: false,
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ResourceLinkNodeView, {
            as: 'resource-link',
            className: 'inline-flex',
        });
    },
    parseHTML() {
        return [
            {
                tag: 'a[data-resource-link]',
                getAttrs: (el) => {
                    if (!(el instanceof HTMLElement)) return false;
                    return {
                        id: el.getAttribute('data-id') ?? generateId(IdType.Mention),
                        target: el.getAttribute('data-target-id'),
                        targetType: el.getAttribute('data-target-type'),
                        label: el.getAttribute('data-label') ?? el.textContent ?? null,
                    };
                },
            },
        ];
    },
    renderHTML({ node }) {
        const label = (node.attrs.label as string | null) ?? 'Untitled';
        return [
            'a',
            {
                'data-resource-link': '',
                'data-id': node.attrs.id ?? '',
                'data-target-id': node.attrs.target ?? '',
                'data-target-type': node.attrs.targetType ?? '',
                'data-label': label,
                href: '#',
            },
            `[[${label}]]`,
        ];
    },
    renderText({ node }) {
        const label = (node.attrs.label as string | null) ?? 'Untitled';
        return `[[${label}]]`;
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                pluginKey: new PluginKey('resourceLinkSuggestion'),
                editor: this.editor,
                char: '[[',
                allowSpaces: true,
                allowedPrefixes: null,
                startOfLine: false,
                command: ({
                    editor,
                    range,
                    props,
                }: {
                    editor: Editor;
                    range: Range;
                    props: MentionSearchItem;
                }) => {
                    editor
                        .chain()
                        .focus()
                        .insertContentAt(range, [
                            {
                                type: this.name,
                                attrs: {
                                    id: generateId(IdType.Mention),
                                    target: props.id,
                                    targetType: props.type,
                                    label: props.name,
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
                allow: ({ state, range, editor }) => {
                    const $from = state.doc.resolve(range.from);
                    const type = state.schema.nodes[this.name];
                    if (!type) return false;
                    if (!$from.parent.type.contentMatch.matchType(type)) {
                        return false;
                    }
                    const queryText = editor.state.doc.textBetween(
                        range.from,
                        range.to,
                        '\n',
                        '\0'
                    );
                    // bail out as soon as the user types a closing bracket
                    if (queryText.includes(']')) {
                        return false;
                    }
                    return true;
                },
                items: async ({ query }: { query: string }) => {
                    return new Promise<MentionSearchItem[]>((resolve) => {
                        if (!this.options.context) {
                            resolve([] as MentionSearchItem[]);
                            return;
                        }

                        const { userId } = this.options.context;
                        window.colanode
                            .executeQuery({
                                type: 'mention.search',
                                userId,
                                searchQuery: query,
                                allowedTypes: RESOURCE_LINK_ALLOWED_TYPES,
                            })
                            .then((mentions) => {
                                resolve(mentions);
                            });
                    });
                },
                render: renderItems,
            }),
        ];
    },
});
