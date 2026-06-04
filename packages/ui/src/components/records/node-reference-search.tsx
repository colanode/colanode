import { useState } from 'react';

import { MentionSearchItem, MentionTargetType } from '@colanode/client/types';
import { Avatar } from '@colanode/ui/components/avatars/avatar';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@colanode/ui/components/ui/command';
import {
    ScrollArea,
    ScrollViewport,
    ScrollBar,
} from '@colanode/ui/components/ui/scroll-area';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface NodeReferenceSearchProps {
    exclude?: string[];
    allowedTypes?: MentionTargetType[];
    placeholder?: string;
    onSelect: (item: MentionSearchItem) => void;
}

export const NodeReferenceSearch = ({
    exclude,
    allowedTypes,
    placeholder = 'Search resources...',
    onSelect,
}: NodeReferenceSearchProps) => {
    const workspace = useWorkspace();

    const [query, setQuery] = useState('');
    const mentionQuery = useQuery({
        type: 'mention.search',
        searchQuery: query,
        userId: workspace.userId,
        limit: 30,
        allowedTypes,
    });

    const items = (mentionQuery.data ?? []) as MentionSearchItem[];
    const filtered = items.filter((item) => {
        if (exclude?.includes(item.id)) return false;
        if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(item.type)) {
            return false;
        }
        return true;
    });

    const TYPE_HEADINGS: Record<MentionTargetType, string> = {
        user: 'Users',
        group: 'Groups',
        channel: 'Channels',
        page: 'Pages',
        record: 'Records',
        database: 'Databases',
        chat: 'Chats',
        space: 'Spaces',
        folder: 'Folders',
        file: 'Files',
    };
    const TYPE_ORDER: MentionTargetType[] = [
        'channel',
        'database',
        'page',
        'folder',
        'file',
        'record',
        'chat',
        'user',
        'group',
        'space',
    ];
    const grouped = new Map<MentionTargetType, MentionSearchItem[]>();
    for (const item of filtered) {
        const arr = grouped.get(item.type) ?? [];
        arr.push(item);
        grouped.set(item.type, arr);
    }
    const groupKeys = TYPE_ORDER.filter((t) => grouped.has(t));

    return (
        <Command className="min-h-min" shouldFilter={false}>
            <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder={placeholder}
                className="h-9"
            />
            <CommandEmpty>No result.</CommandEmpty>
            <ScrollArea className="h-80">
                <ScrollViewport>
                    <CommandList className="max-h-none overflow-hidden">
                        {groupKeys.map((typeKey) => (
                            <CommandGroup
                                key={typeKey}
                                heading={TYPE_HEADINGS[typeKey]}
                                className="h-min"
                            >
                                {grouped.get(typeKey)!.map((item) => (
                                    <CommandItem
                                        key={`${item.type}:${item.id}`}
                                        value={`${item.type}:${item.id}:${item.name}`}
                                        onSelect={() => {
                                            onSelect(item);
                                            setQuery('');
                                        }}
                                    >
                                        <div className="flex w-full flex-row items-center gap-2">
                                            <Avatar
                                                id={item.id}
                                                name={item.name}
                                                avatar={item.avatar ?? null}
                                                className="size-4"
                                            />
                                            <p className="text-sm grow truncate">
                                                {item.name || 'Untitled'}
                                            </p>
                                            {item.subtitle && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[50%]">
                                                    {item.subtitle}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </ScrollViewport>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </Command>
    );
};
