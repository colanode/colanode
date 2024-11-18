import React from 'react';
import {
  MessageEditor,
  MessageEditorRefProps,
} from '@/renderer/components/messages/message-editor';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { useWorkspace } from '@/renderer/contexts/workspace';
import { MessageNode } from '@colanode/core';
import { editorHasContent } from '@/shared/lib/editor';
import { useConversation } from '@/renderer/contexts/conversation';
import { MessageReplyBanner } from '@/renderer/components/messages/message-reply-banner';
import { JSONContent } from '@tiptap/core';
import { Spinner } from '@/renderer/components/ui/spinner';
import { Send, Plus, Search, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { toast } from '@/renderer/hooks/use-toast';

export interface MessageCreateRefProps {
  setReplyTo: (replyTo: MessageNode) => void;
}

export const MessageCreate = React.forwardRef<MessageCreateRefProps>(
  (_, ref) => {
    const workspace = useWorkspace();
    const conversation = useConversation();

    const { mutate, isPending } = useMutation();

    const messageEditorRef = React.useRef<MessageEditorRefProps>(null);
    const [content, setContent] = React.useState<JSONContent | null>(null);
    const [replyTo, setReplyTo] = React.useState<MessageNode | null>(null);

    const hasContent = content != null && editorHasContent(content);

    React.useImperativeHandle(ref, () => ({
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

    const handleSubmit = React.useCallback(() => {
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
          type: 'message_create',
          conversationId: conversation.id,
          content: content,
          userId: workspace.userId,
          referenceId: replyTo?.id,
        },
        onSuccess: () => {
          setReplyTo(null);
          if (messageEditorRef.current) {
            messageEditorRef.current.clear();
            messageEditorRef.current.focus();
          }
        },
      });
    }, [
      conversation.id,
      conversation.canCreateMessage,
      content,
      replyTo,
      workspace.userId,
    ]);

    const handleUploadClick = React.useCallback(async () => {
      if (messageEditorRef.current == null) {
        return;
      }

      const result = await window.colanode.executeCommand({
        type: 'file_dialog_open',
        options: {
          properties: ['openFile'],
          buttonLabel: 'Upload',
          title: 'Upload files to message',
        },
      });

      if (result.canceled) {
        return;
      }

      const filePath = result.filePaths[0];
      const fileMetadata = await window.colanode.executeQuery({
        type: 'file_metadata_get',
        path: filePath,
      });

      if (fileMetadata === null) {
        toast({
          title: 'Failed to add file',
          description:
            'Something went wrong adding file to the message. Please try again!',
          variant: 'destructive',
        });

        return;
      }

      messageEditorRef.current?.addFile(fileMetadata);
    }, [messageEditorRef]);

    return (
      <div className="container mt-1 px-10">
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
                  ref={messageEditorRef}
                  conversationId={conversation.id}
                  onChange={setContent}
                  onSubmit={handleSubmit}
                />
              ) : (
                <p className="m-0 px-0 py-1 text-muted-foreground">
                  You don't have permission to create messages in this
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
        <div className="flex h-8 min-h-8 items-center text-xs text-muted-foreground"></div>
      </div>
    );
  }
);
