import { Hash, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { LocalMessageNode, MentionSearchItem } from '@colanode/client/types';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@colanode/ui/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';

interface MessageForwardDialogProps {
    message: LocalMessageNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MessageForwardDialog = ({
    message,
    open,
    onOpenChange,
}: MessageForwardDialogProps) => {
    const workspace = useWorkspace();
    const [query, setQuery] = useState('');
    const { mutate, isPending } = useMutation();

    const { data } = useQuery(
        {
            type: 'mention.search',
            userId: workspace.userId,
            searchQuery: query,
            limit: 30,
        },
        {
            enabled: open,
        }
    );

    const items = (data ?? []) as MentionSearchItem[];
    const targets = items.filter(
        (item) => item.type === 'channel' || item.type === 'chat'
    );

    const handleSelect = (target: MentionSearchItem) => {
        if (isPending) {
            return;
        }
        mutate({
            input: {
                type: 'message.forward',
                userId: workspace.userId,
                sourceMessageId: message.id,
                targetParentId: target.id,
            },
            onSuccess: () => {
                toast.success(`Forwarded to ${target.name || 'destination'}`);
                onOpenChange(false);
                setQuery('');
            },
            onError: (error) => {
                toast.error(error.message);
            },
        });
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(value) => {
                onOpenChange(value);
                if (!value) {
                    setQuery('');
                }
            }}
        >
            <DialogContent className="max-w-lg p-0">
                <DialogHeader className="border-b border-border px-4 py-3">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Send className="size-4" />
                        Forward message
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Pick a channel or chat to forward this message to. Attachments are
                        not included.
                    </DialogDescription>
                </DialogHeader>
                <Command shouldFilter={false}>
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder="Search channels or chats..."
                    />
                    <CommandList>
                        <CommandEmpty>No destinations found.</CommandEmpty>
                        {targets.length > 0 && (
                            <CommandGroup heading="Destinations">
                                {targets.map((target) => (
                                    <CommandItem
                                        key={target.id}
                                        value={`${target.type}:${target.id}:${target.name}`}
                                        onSelect={() => handleSelect(target)}
                                        disabled={isPending}
                                    >
                                        {target.type === 'channel' ? (
                                            <Hash className="size-4" />
                                        ) : (
                                            <MessageSquare className="size-4" />
                                        )}
                                        <span className="truncate">{target.name || 'Untitled'}</span>
                                        {target.subtitle && (
                                            <span className="ml-auto truncate text-xs text-muted-foreground">
                                                {target.subtitle}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
};
