import { useLiveQuery } from '@tanstack/react-db';
import {
    Database,
    File,
    FileText,
    Folder,
    Hash,
    MessageSquare,
    Search,
    Settings,
    Users,
} from 'lucide-react';
import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { MentionSearchItem } from '@colanode/client/types';
import { collections } from '@colanode/ui/collections';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@colanode/ui/components/ui/command';
import { useMetadata } from '@colanode/ui/hooks/use-metadata';
import { useQuery } from '@colanode/ui/hooks/use-query';
import { getDefaultWorkspaceUserId } from '@colanode/ui/routes/utils';

const typeIconMap: Record<string, ReactNode> = {
    channel: <Hash className="size-4" />,
    page: <FileText className="size-4" />,
    record: <FileText className="size-4" />,
    database: <Database className="size-4" />,
    chat: <MessageSquare className="size-4" />,
    space: <Folder className="size-4" />,
    folder: <Folder className="size-4" />,
    file: <File className="size-4" />,
    user: <Users className="size-4" />,
};

interface GlobalCommandPaletteProps {
    openInCurrentTab: (location: string) => void;
    openInNewTab: (location: string) => void;
}

export const GlobalCommandPalette = ({
    openInCurrentTab,
    openInNewTab,
}: GlobalCommandPaletteProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const openInNewTabRef = useRef(false);
    const [workspaceUserId] = useMetadata<string>('app', 'workspace');

    const defaultWorkspaceUserId = getDefaultWorkspaceUserId();
    const activeWorkspaceUserId = workspaceUserId ?? defaultWorkspaceUserId;

    const workspacesQuery = useLiveQuery(
        (q) =>
            q
                .from({ workspaces: collections.workspaces })
                .select(({ workspaces }) => ({
                    userId: workspaces.userId,
                    workspaceId: workspaces.workspaceId,
                    role: workspaces.role,
                }))
                .orderBy(({ workspaces }) => workspaces.userId, 'asc'),
        []
    );

    const mentionSearchQuery = useQuery(
        {
            type: 'mention.search',
            userId: activeWorkspaceUserId ?? '',
            searchQuery: query,
            limit: 30,
        },
        {
            enabled: open && !!activeWorkspaceUserId,
        }
    );

    const mentions = mentionSearchQuery.data ?? [];
    const resourceResults = useMemo(
        () => mentions.filter((item) => item.type !== 'user'),
        [mentions]
    );
    const userResults = useMemo(
        () => mentions.filter((item) => item.type === 'user'),
        [mentions]
    );

    const closePalette = useCallback(() => {
        setOpen(false);
        setQuery('');
    }, []);

    const openLocation = useCallback(
        (location: string) => {
            if (openInNewTabRef.current) {
                openInNewTab(location);
                closePalette();
                return;
            }

            openInCurrentTab(location);
            closePalette();
        },
        [closePalette, openInCurrentTab, openInNewTab]
    );

    const openWorkspaceHome = useCallback(
        (userId: string) => {
            openLocation(`/workspace/${userId}/home`);
        },
        [openLocation]
    );

    const openNode = useCallback(
        (item: MentionSearchItem) => {
            if (!activeWorkspaceUserId) {
                return;
            }

            if (item.type === 'user') {
                openLocation(`/workspace/${activeWorkspaceUserId}/users`);
            } else {
                openLocation(`/workspace/${activeWorkspaceUserId}/${item.id}`);
            }
        },
        [activeWorkspaceUserId, openLocation]
    );

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setOpen((prev) => !prev);
                return;
            }

            if (open && event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                openInNewTabRef.current = true;
                setTimeout(() => {
                    openInNewTabRef.current = false;
                }, 0);
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    return (
        <CommandDialog
            open={open}
            onOpenChange={(value) => {
                setOpen(value);
                if (!value) {
                    setQuery('');
                }
            }}
            className="max-w-2xl"
            title="Global Command Palette"
            description="Search and jump to anything"
        >
            <CommandInput
                value={query}
                onValueChange={setQuery}
                placeholder="Search channels, pages, records, users... (⌘Enter/Ctrl+Enter in new tab)"
            />
            <CommandList>
                <CommandEmpty>
                    {mentionSearchQuery.isPending ? 'Searching...' : 'No results found.'}
                </CommandEmpty>

                {activeWorkspaceUserId && (
                    <CommandGroup heading="Quick actions">
                        <CommandItem
                            value="Open workspace home"
                            onSelect={() => {
                                openLocation(`/workspace/${activeWorkspaceUserId}/home`);
                            }}
                        >
                            <Search className="size-4" />
                            <span>Open workspace home</span>
                            <CommandShortcut>⌘H</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                            value="Open workspace settings"
                            onSelect={() => {
                                openLocation(`/workspace/${activeWorkspaceUserId}/settings`);
                            }}
                        >
                            <Settings className="size-4" />
                            <span>Open workspace settings</span>
                        </CommandItem>
                        <CommandItem
                            value="Open workspace users"
                            onSelect={() => {
                                openLocation(`/workspace/${activeWorkspaceUserId}/users`);
                            }}
                        >
                            <Users className="size-4" />
                            <span>Open workspace users</span>
                        </CommandItem>
                    </CommandGroup>
                )}

                <CommandSeparator />

                <CommandGroup heading="Workspaces">
                    {workspacesQuery.data.map((workspace) => (
                        <CommandItem
                            key={workspace.userId}
                            value={`Workspace ${workspace.workspaceId}`}
                            onSelect={() => {
                                openWorkspaceHome(workspace.userId);
                            }}
                        >
                            <Folder className="size-4" />
                            <span>{workspace.workspaceId}</span>
                            <CommandShortcut>{workspace.role}</CommandShortcut>
                        </CommandItem>
                    ))}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Resources">
                    {resourceResults.map((item) => (
                        <CommandItem
                            key={`${item.type}:${item.id}`}
                            value={`${item.name} ${item.type} ${item.subtitle ?? ''}`}
                            onSelect={() => {
                                openNode(item);
                            }}
                        >
                            {typeIconMap[item.type] ?? <FileText className="size-4" />}
                            <span>{item.name}</span>
                            <CommandShortcut>{item.type}</CommandShortcut>
                        </CommandItem>
                    ))}
                </CommandGroup>

                {userResults.length > 0 && (
                    <CommandGroup heading="People">
                        {userResults.map((item) => (
                            <CommandItem
                                key={`user:${item.id}`}
                                value={`${item.name} ${item.subtitle ?? ''}`}
                                onSelect={() => {
                                    openNode(item);
                                }}
                            >
                                <Users className="size-4" />
                                <span>{item.name}</span>
                                {item.subtitle && <CommandShortcut>{item.subtitle}</CommandShortcut>}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </CommandDialog>
    );
};
