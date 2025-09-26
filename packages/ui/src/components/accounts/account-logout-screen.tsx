import { useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { Breadcrumb } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb';
import { BreadcrumbItem } from '@colanode/ui/components/layouts/breadcrumbs/breadcrumb-item';
import { Button } from '@colanode/ui/components/ui/button';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useAccount } from '@colanode/ui/contexts/account';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const AccountLogoutScreen = () => {
  const account = useAccount();
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem
          icon={(className) => <LogOut className={className} />}
          name="Logout"
        />
      </Breadcrumb>
      <div className="max-w-4xl space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Logout</h2>
            <Separator className="mt-3" />
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">Sign out of your account</h3>
              <p className="text-sm text-muted-foreground">
                All your data will be removed from this device. If there are
                pending changes, they will be lost. If you login again, all the
                data will be re-synced.
              </p>
            </div>
            <div className="w-full md:w-auto md:flex-shrink-0">
              <Button
                variant="destructive"
                disabled={isPending}
                className="w-full cursor-pointer md:w-20"
                onClick={async () => {
                  mutate({
                    input: {
                      type: 'account.logout',
                      accountId: account.id,
                    },
                    onSuccess() {
                      navigate({
                        to: '/',
                        replace: true,
                      });
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
      </div>
    </>
  );
};
