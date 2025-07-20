import { toast } from 'sonner';

import { Button } from '@colanode/ui/components/ui/button';
import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const AccountLogout = () => {
  const account = useAccount();
  const { mutate, isPending } = useMutation();

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Logout</h2>
            <Separator className="mt-3" />
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">Sign out of your account</h3>
              <p className="text-sm text-muted-foreground">
                All your data will be removed from this device. If there are
                pending changes, they will be lost. If you login again, all the
                data will be re-synced.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button
                variant="destructive"
                disabled={isPending}
                className="w-20 cursor-pointer"
                onClick={async () => {
                  mutate({
                    input: {
                      type: 'account.logout',
                      accountId: account.id,
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
            </div>
          </div>
        </div>
      </ContainerBody>
    </Container>
  );
};
