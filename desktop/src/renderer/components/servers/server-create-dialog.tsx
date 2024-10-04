import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Label } from '@/renderer/components/ui/label';
import { Input } from '@/renderer/components/ui/input';
import { Spinner } from '@/renderer/components/ui/spinner';
import { toast } from '@/renderer/components/ui/use-toast';
import { useMutation } from '@/renderer/hooks/use-mutation';

interface ServerCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServerCreateDialog = ({
  open,
  onOpenChange,
}: ServerCreateDialogProps) => {
  const { mutate, isPending } = useMutation();
  const [domain, setDomain] = React.useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a server</DialogTitle>
          <DialogDescription>Add a custom server to login to</DialogDescription>
        </DialogHeader>
        <div className="flex-grow space-y-2 py-2 pb-4">
          <Label>Server Domain</Label>
          <Input
            placeholder="us.neuronapp.io"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
                onSuccess() {
                  onOpenChange(false);
                },
                onError() {
                  toast({
                    title: 'Failed to login',
                    description:
                      'Something went wrong adding the server. Please make sure the domain is correct.',
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