import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Info, Trash2 } from 'lucide-react';

import { AccountUpdate } from '@/renderer/components/accounts/account-update';
import { Avatar } from '@/renderer/components/avatars/avatar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/renderer/components/ui/tabs';
import { useAccount } from '@/renderer/contexts/account';

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountSettingsDialog = ({
  open,
  onOpenChange,
}: AccountSettingsDialogProps) => {
  const account = useAccount();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="md:min-h-3/4 md:max-h-3/4 p-3 md:h-3/4 md:w-3/4 md:max-w-full"
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Workspace Settings</DialogTitle>
        </VisuallyHidden>
        <Tabs
          defaultValue="info"
          className="grid h-full max-h-full grid-cols-[240px_minmax(0,1fr)] overflow-hidden"
        >
          <TabsList className="flex h-full max-h-full flex-col items-start justify-start gap-1 rounded-none border-r border-r-gray-100 bg-white pr-3">
            <div className="mb-1 flex h-10 w-full items-center justify-between bg-gray-50 p-1 text-foreground/80">
              <div className="flex items-center gap-2">
                <Avatar
                  id={account.id}
                  name={account.name}
                  avatar={account.avatar}
                  size="small"
                />
                <span>{account.name}</span>
              </div>
            </div>
            <TabsTrigger
              key={`tab-trigger-info`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="info"
            >
              <Info className="mr-2 size-4" />
              Info
            </TabsTrigger>
            <TabsTrigger
              key={`tab-trigger-delete`}
              className="w-full justify-start p-2 hover:bg-gray-50"
              value="delete"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </TabsTrigger>
          </TabsList>
          <div className="overflow-auto p-4">
            <TabsContent
              key="tab-content-info"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="info"
            >
              <AccountUpdate account={account} />
            </TabsContent>
            <TabsContent
              key="tab-content-delete"
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              value="delete"
            >
              <p>Coming soon.</p>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
