import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog';
import { Button } from '@/renderer/components/ui/button';
import { Spinner } from '@/renderer/components/ui/spinner';
import { useAccount } from '@/renderer/contexts/account';
import { useMutation } from '@/renderer/hooks/use-mutation';
import { toast } from '@/renderer/hooks/use-toast';

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
            onClick={async () => {
              mutate({
                input: {
                  type: 'account_logout',
                  accountId: account.id,
                },
                onSuccess() {
                  onLogout();
                },
                onError(error) {
                  toast({
                    title: 'Failed to logout',
                    description: error.message,
                    variant: 'destructive',
                  });
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
