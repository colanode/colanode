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
import { useI18n } from '@colanode/ui/contexts/i18n';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface ServerCreateDialogProps {
  onCancel: () => void;
}

export const ServerCreateDialog = ({ onCancel }: ServerCreateDialogProps) => {
  const { t } = useI18n();
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
          <DialogTitle>{t('server.addServer')}</DialogTitle>
          <DialogDescription>{t('misc.addCustomServer')}</DialogDescription>
        </DialogHeader>
        <div className="grow space-y-2 py-2 pb-4">
          <Label>{t('misc.serverUrl')}</Label>
          <Input
            placeholder={t('server.serverUrlPlaceholder')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onCancel()}>
            {t('common.cancel')}
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
                  setOpen(false);
                },
                onError(error) {
                  toast.error(error.message);
                },
              });
            }}
          >
            {isPending && <Spinner className="mr-1" />}
            {t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
