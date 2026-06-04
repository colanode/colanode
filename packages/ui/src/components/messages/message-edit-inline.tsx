import { JSONContent } from '@tiptap/core';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { editorHasContent, mapBlocksToContents } from '@colanode/client/lib';
import { LocalMessageNode } from '@colanode/client/types';
import {
    MessageEditor,
    MessageEditorRefProps,
} from '@colanode/ui/components/messages/message-editor';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface MessageEditInlineProps {
    message: LocalMessageNode;
    onClose: () => void;
}

export const MessageEditInline = ({
    message,
    onClose,
}: MessageEditInlineProps) => {
    const workspace = useWorkspace();
    const conversation = useConversation();
    const { mutate, isPending } = useMutation();

    const initialContent = useMemo<JSONContent>(() => {
        const blocks = Object.values(message.content ?? {});
        const contents = mapBlocksToContents(message.id, blocks);
        return {
            type: 'message',
            content: contents,
        };
    }, [message.id, message.content]);

    const editorRef = useRef<MessageEditorRefProps>(null);
    const [content, setContent] = useState<JSONContent>(initialContent);

    const handleSubmit = useCallback(() => {
        if (!editorHasContent(content)) {
            toast.error('Message cannot be empty.');
            return;
        }

        mutate({
            input: {
                type: 'message.update',
                userId: workspace.userId,
                messageId: message.id,
                content,
            },
            onSuccess: () => {
                onClose();
            },
            onError: (error) => {
                toast.error(error.message);
            },
        });
    }, [content, message.id, mutate, onClose, workspace.userId]);

    return (
        <div className="flex flex-col gap-1 rounded bg-muted p-2">
            <MessageEditor
                ref={editorRef}
                userId={workspace.userId}
                accountId={workspace.accountId}
                workspaceId={workspace.workspaceId}
                conversationId={conversation.id}
                rootId={conversation.rootId}
                initialContent={initialContent}
                onChange={setContent}
                onSubmit={handleSubmit}
            />
            <div className="flex flex-row items-center justify-end gap-2 text-xs">
                <button
                    type="button"
                    className="cursor-pointer rounded px-2 py-1 text-muted-foreground hover:bg-accent"
                    onClick={onClose}
                    disabled={isPending}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="cursor-pointer rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:cursor-default disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={isPending}
                >
                    {isPending ? <Spinner size={14} /> : 'Save'}
                </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
                Press Enter to save, Shift+Enter for a new line.
            </p>
        </div>
    );
};
