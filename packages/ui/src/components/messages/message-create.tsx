import { JSONContent } from '@tiptap/core';
import { Plus, Search, Send, Upload } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { editorHasContent } from '@colanode/client/lib';
import { LocalMessageNode } from '@colanode/client/types';
import {
  MessageEditor,
  MessageEditorRefProps,
} from '@colanode/ui/components/messages/message-editor';
import { MessageReplyBanner } from '@colanode/ui/components/messages/message-reply-banner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@colanode/ui/components/ui/dropdown-menu';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useConversation } from '@colanode/ui/contexts/conversation';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { openFileDialog } from '@colanode/ui/lib/files';

export interface MessageCreateRefProps {
  setReplyTo: (replyTo: LocalMessageNode) => void;
}

export const MessageCreate = forwardRef<MessageCreateRefProps>((_, ref) => {
  const workspace = useWorkspace();
  const conversation = useConversation();

  const { mutate, isPending } = useMutation();

  const messageEditorRef = useRef<MessageEditorRefProps>(null);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [replyTo, setReplyTo] = useState<LocalMessageNode | null>(null);

  const hasContent = content != null && editorHasContent(content);

  useImperativeHandle(ref, () => ({
    setReplyTo: (replyTo) => {
      if (!conversation.canCreateMessage) {
        return;
      }

      setReplyTo(replyTo);
      if (messageEditorRef.current) {
        messageEditorRef.current.focus();
      }
    },
  }));

  const handleSubmit = useCallback(() => {
    if (!conversation.canCreateMessage) {
      return;
    }

    if (content == null || !editorHasContent(content)) {
      return;
    }

    if (!content || !content.content) {
      return;
    }

    mutate({
      input: {
        type: 'message.create',
        parentId: conversation.id,
        content: content,
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        referenceId: replyTo?.id,
        rootId: conversation.rootId,
      },
      onSuccess: () => {
        setReplyTo(null);
        if (messageEditorRef.current) {
          messageEditorRef.current.clear();
          messageEditorRef.current.focus();
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  }, [
    conversation.id,
    conversation.canCreateMessage,
    content,
    replyTo,
    workspace.userId,
  ]);

  const handleUploadClick = useCallback(async () => {
    if (messageEditorRef.current == null) {
      return;
    }

    const result = await openFileDialog();

    if (result.type === 'success') {
      result.files.forEach((file) => {
        messageEditorRef.current?.addTempFile(file);
      });
    } else if (result.type === 'error') {
      toast.error(result.error);
    }
  }, [messageEditorRef]);

  return (
    <div className="mt-1">
      <div className="flex flex-col">
        {conversation.canCreateMessage && replyTo && (
          <MessageReplyBanner
            message={replyTo}
            onCancel={() => setReplyTo(null)}
          />
        )}
        <div className="flex min-h-0 flex-row items-center rounded bg-gray-100 p-2 pl-0">
          <div className="flex w-10 items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={isPending || !conversation.canCreateMessage}
              >
                <span>
                  <Plus size={20} />
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem disabled={true}>
                  <div className="flex flex-row items-center gap-2 text-sm">
                    <Search className="size-4" />
                    <span>Browse</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleUploadClick}>
                  <div className="flex cursor-pointer flex-row items-center gap-2 text-sm">
                    <Upload className="size-4" />
                    <span>Upload</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="max-h-72 flex-grow overflow-y-auto">
            {conversation.canCreateMessage ? (
              <MessageEditor
                accountId={workspace.accountId}
                workspaceId={workspace.id}
                ref={messageEditorRef}
                conversationId={conversation.id}
                rootId={conversation.rootId}
                onChange={setContent}
                onSubmit={handleSubmit}
              />
            ) : (
              <p className="m-0 px-0 py-1 text-muted-foreground">
                You don&apos;t have permission to create messages in this
                conversation
              </p>
            )}
          </div>
          <div className="flex flex-row gap-2">
            {isPending ? (
              <Spinner size={20} />
            ) : (
              <button
                type="submit"
                className={`${
                  conversation.canCreateMessage && hasContent
                    ? 'cursor-pointer text-blue-600'
                    : 'cursor-default text-muted-foreground'
                }`}
                onClick={handleSubmit}
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex h-3 min-h-3 items-center text-xs text-muted-foreground"></div>
    </div>
  );
});

MessageCreate.displayName = 'MessageCreate';
