import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@colanode/ui/components/ui/alert-dialog';
import { Button } from '@colanode/ui/components/ui/button';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

interface AccountLogoutProps {
  onCancel: () => void;
  onLogout: () => void;
}

export const AccountLogout = ({ onCancel, onLogout }: AccountLogoutProps) => {
  const account = useAccount();
  const { mutate, isPending } = useMutation();
  return (
    <AlertDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want logout?</AlertDialogTitle>
          <AlertDialogDescription>
            All your data will be removed from this device.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending}
            className="cursor-pointer"
            onClick={async () => {
              mutate({
                input: {
                  type: 'account.logout',
                  accountId: account.id,
                },
                onSuccess() {
                  onLogout();
                },
                onError(error) {
                  toast.error(error.message);
                },
              });
            }}
          >
            {isPending && <Spinner className="mr-1" />}
            Logout
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
