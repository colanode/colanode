import React from 'react';
import { Server } from '@colanode/client/types';

import { Button } from '@/renderer/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

interface ServerCreateDialogProps {
  onCancel: () => void;
  onCreate: (server: Server) => void;
}

export const ServerCreateDialog = ({
  onCancel,
  onCreate,
}: ServerCreateDialogProps) => {
  const [open, setOpen] = React.useState(true);
  const { mutate, isPending } = useMutation();
  const [domain, setDomain] = React.useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        onCancel();
        setOpen(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a server</DialogTitle>
          <DialogDescription>Add a custom server to login to</DialogDescription>
        </DialogHeader>
        <div className="flex-grow space-y-2 py-2 pb-4">
          <Label>Server Domain</Label>
          <Input
            placeholder="us.colanode.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onCancel()}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              mutate({
                input: {
                  type: 'server_create',
                  domain,
                },
                onSuccess(output) {
                  onCreate(output.server);
                },
                onError(error) {
                  toast({
                    title: 'Failed to add server',
                    description: error.message,
                    variant: 'destructive',
                  });
                },
              });
            }}
          >
            {isPending && <Spinner className="mr-1" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
