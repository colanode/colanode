import { Pin } from 'lucide-react';
import { Fragment } from 'react';

import { LocalMessageNode } from '@colanode/client/types';
import { MessageAuthorAvatar } from '@colanode/ui/components/messages/message-author-avatar';
import { MessageAuthorName } from '@colanode/ui/components/messages/message-author-name';
import { MessageContent } from '@colanode/ui/components/messages/message-content';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useQuery } from '@colanode/ui/hooks/use-query';

export const PinnedMessagesPopover = () => {
    const workspace = useWorkspace();
    const conversation = useConversation();

    const { data } = useQuery({
        type: 'message.search',
        userId: workspace.userId,
        conversationId: conversation.id,
        pinnedOnly: true,
        limit: 100,
    });

    const messages = (data ?? []) as LocalMessageNode[];
    const count = messages.length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="flex h-8 items-center gap-1 rounded border border-border px-2 text-xs text-muted-foreground hover:bg-accent"
                    aria-label="Pinned messages"
                >
                    <Pin className="size-3.5" />
                    <span>Pinned</span>
                    {count > 0 && (
                        <span className="ml-1 rounded bg-yellow-200/60 px-1 text-[10px] font-medium text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200">
                            {count}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
                <div className="border-b border-border px-3 py-2 text-sm font-medium">
                    Pinned messages
                </div>
                {count === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        No pinned messages yet.
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto py-1">
                        {messages.map((message) => (
                            <Fragment key={message.id}>
                                <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left hover:bg-accent"
                                    onClick={() => conversation.onLocateMessage(message.id)}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="w-8 shrink-0 pt-0.5">
                                            <MessageAuthorAvatar message={message} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <MessageAuthorName message={message} />
                                            <div className="line-clamp-3 text-xs text-muted-foreground">
                                                <MessageContent message={message} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            </Fragment>
                        ))}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};
