import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { NodeReactionCount, LocalMessageNode } from '@colanode/client/types';
import { EmojiElement } from '@colanode/ui/components/emojis/emoji-element';
import { MessageReactionCountsDialogList } from '@colanode/ui/components/messages/message-reaction-counts-dialog-list';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@colanode/ui/components/ui/tabs';

interface MessageReactionCountsDialogProps {
  message: LocalMessageNode;
  reactionCounts: NodeReactionCount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MessageReactionCountsDialog = ({
  message,
  reactionCounts,
  open,
  onOpenChange,
}: MessageReactionCountsDialogProps) => {
  if (reactionCounts.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-2 outline-none w-128 min-w-128 max-w-128 h-128 min-h-128 max-h-128">
        <VisuallyHidden>
          <DialogTitle>Reactions</DialogTitle>
        </VisuallyHidden>
        <Tabs
          defaultValue={reactionCounts[0]!.reaction}
          className="flex flex-row gap-4"
        >
          <TabsList className="flex h-full max-h-full w-24 flex-col items-start justify-start gap-1 rounded-none border-r border-r-gray-100 bg-white pr-3">
            {reactionCounts.map((reactionCount) => (
              <TabsTrigger
                key={`tab-trigger-${reactionCount.reaction}`}
                className="flex w-full flex-row items-center justify-start gap-2 p-2"
                value={reactionCount.reaction}
              >
                <EmojiElement id={reactionCount.reaction} className="h-5 w-5" />
                {reactionCount.count}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-grow">
            {reactionCounts.map((reactionCount) => (
              <TabsContent
                key={`tab-content-${reactionCount.reaction}`}
                className="relative h-full focus-visible:ring-0 focus-visible:ring-offset-0"
                value={reactionCount.reaction}
              >
                <div className="absolute bottom-0 left-0 right-0 top-0 h-full overflow-y-auto">
                  <MessageReactionCountsDialogList
                    message={message}
                    reactionCount={reactionCount}
                  />
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
