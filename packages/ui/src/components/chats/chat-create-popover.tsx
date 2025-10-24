import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { SquarePen } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { LocalChatNode } from '@colanode/client/types';
import { generateId, IdType } from '@colanode/core';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@colanode/ui/components/ui/popover';
import { UserSearch } from '@colanode/ui/components/users/user-search';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { database } from '@colanode/ui/data';

export const ChatCreatePopover = () => {
  const workspace = useWorkspace();
  const navigate = useNavigate({ from: '/workspace/$userId' });

  const [open, setOpen] = useState(false);

  const { mutate } = useMutation({
    mutationFn: async (otherUserId: string) => {
      const nodes = database.workspace(workspace.userId).nodes;
      for (const [, node] of nodes.entries()) {
        if (node.type !== 'chat') {
          continue;
        }

        const collaborators = node.attributes.collaborators;
        if (collaborators[otherUserId]) {
          return node;
        }
      }

      const chatId = generateId(IdType.Chat);
      const chat: LocalChatNode = {
        id: chatId,
        type: 'chat',
        attributes: {
          type: 'chat',
          collaborators: {
            [workspace.userId]: 'admin',
            [otherUserId]: 'admin',
          },
        },
        parentId: chatId,
        rootId: chatId,
        createdAt: new Date().toISOString(),
        createdBy: workspace.userId,
        updatedAt: null,
        updatedBy: null,
        localRevision: '0',
        serverRevision: '0',
      };
      nodes.insert(chat);
      return chat;
    },
    onSuccess: (chat) => {
      navigate({
        to: '$nodeId',
        params: {
          nodeId: chat.id,
        },
      });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <SquarePen className="size-4 cursor-pointer" />
      </PopoverTrigger>
      <PopoverContent className="w-96 p-1">
        <UserSearch
          exclude={[workspace.userId]}
          onSelect={(user) => mutate(user.id)}
        />
      </PopoverContent>
    </Popover>
  );
};
