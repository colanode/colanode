import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@colanode/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@colanode/ui/components/ui/dialog';
import { Input } from '@colanode/ui/components/ui/input';
import { Label } from '@colanode/ui/components/ui/label';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface ServerCreateDialogProps {
  onCancel: () => void;
}

export const ServerCreateDialog = ({ onCancel }: ServerCreateDialogProps) => {
  const [open, setOpen] = useState(true);
  const { mutate, isPending } = useMutation();
  const [url, setUrl] = useState('');

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
        <div className="grow space-y-2 py-2 pb-4">
          <Label>Server URL</Label>
          <Input
            placeholder="https://us.colanode.com/config"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
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
                  type: 'server.create',
                  url,
                },
                onSuccess() {
                  toast.success('Server added successfully');
                },
                onError(error) {
                  toast.error(error.message);
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
